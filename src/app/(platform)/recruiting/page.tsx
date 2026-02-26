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
import { Briefcase, Users, Plus, Star, Pencil, ArrowRight, Globe, Send, Check, AlertCircle, ExternalLink, Calendar, UserCheck, ClipboardList, BarChart3, Clock, Tag, MessageSquare, FileCheck, DollarSign, CheckCircle2, XCircle, Eye } from 'lucide-react'
import { useTempo } from '@/lib/store'
import { AIScoreBadge, AIAlertBanner } from '@/components/ai'
import { scoreCandidateFit, analyzePipelineHealth, predictTimeToHire, scoreCareerSiteEffectiveness, recommendJobBoards, generateInterviewQuestions, analyzeDiversityPipeline, scoreInterviewPanel, generateOfferPackage } from '@/lib/ai-engine'
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
    interviews, talentPools, scoreCards,
    addInterview, updateInterview,
    addTalentPool, updateTalentPool,
    addScoreCard, updateScoreCard,
    offers, addOffer, updateOffer,
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

  // Interview modal
  const [showInterviewModal, setShowInterviewModal] = useState(false)
  const [interviewForm, setInterviewForm] = useState({
    application_id: '',
    job_id: '',
    candidate_name: '',
    interviewer_id: '',
    interviewer_name: '',
    type: 'technical' as string,
    scheduled_at: '',
    duration_min: 60,
    kit_name: '',
  })

  // Interview feedback modal
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [feedbackForm, setFeedbackForm] = useState({ interview_id: '', score: 0, feedback: '' })

  // Talent pool modal
  const [showPoolModal, setShowPoolModal] = useState(false)
  const [poolForm, setPoolForm] = useState({ name: '', description: '', category: 'sourced' as string })

  // Selected talent pool
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null)

  // AI questions state
  const [showQuestionsModal, setShowQuestionsModal] = useState(false)
  const [questionsRole, setQuestionsRole] = useState('')
  const [questionsLevel, setQuestionsLevel] = useState('Mid')

  // Scorecard view
  const [selectedCandidateForSC, setSelectedCandidateForSC] = useState<string | null>(null)

  const openPositions = jobPostings.filter(j => j.status === 'open').length
  const totalApplicants = jobPostings.reduce((a, j) => a + (j.application_count || 0), 0)
  const inInterview = applications.filter(a => a.stage === 'interview' || a.status === 'interview').length
  const offersExtended = applications.filter(a => a.stage === 'offer' || a.status === 'offer').length

  const tabs = [
    { id: 'postings', label: t('tabJobPostings'), count: openPositions },
    { id: 'pipeline', label: t('tabPipeline'), count: applications.length },
    { id: 'career_site', label: t('careerSite') },
    { id: 'interviews', label: t('tabInterviews'), count: interviews.length },
    { id: 'talent_pool', label: t('tabTalentPool'), count: talentPools.reduce((a, p) => a + (p.candidates?.length || 0), 0) },
    { id: 'scorecards', label: t('tabScorecards'), count: scoreCards.length },
    { id: 'dei', label: t('tabDEI') },
    { id: 'offers', label: t('tabOffers'), count: offers.length },
  ]

  const pipelineInsights = useMemo(() => analyzePipelineHealth(applications, jobPostings), [applications, jobPostings])
  const careerSiteScore = useMemo(() => scoreCareerSiteEffectiveness(careerForm), [careerForm])
  const deiData = useMemo(() => analyzeDiversityPipeline(applications, jobPostings), [applications, jobPostings])
  const panelData = useMemo(() => scoreInterviewPanel(interviews), [interviews])

  const upcomingInterviews = useMemo(() => interviews.filter(i => i.status === 'scheduled').sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()), [interviews])
  const pastInterviews = useMemo(() => interviews.filter(i => i.status === 'completed').sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()), [interviews])

  // Group scorecards by candidate
  const scoreCardsByCandidate = useMemo(() => {
    const grouped: Record<string, { candidate_name: string; job_title: string; cards: typeof scoreCards; avgScore: number }> = {}
    scoreCards.forEach(sc => {
      const key = sc.application_id
      if (!grouped[key]) {
        grouped[key] = { candidate_name: sc.candidate_name, job_title: sc.job_title, cards: [], avgScore: 0 }
      }
      grouped[key].cards.push(sc)
    })
    Object.values(grouped).forEach(g => {
      const scores = g.cards.filter(c => c.overall_score > 0).map(c => c.overall_score)
      g.avgScore = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0
    })
    return grouped
  }, [scoreCards])

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

  // ---- Interviews ----
  function openNewInterview() {
    const firstApp = applications[0]
    const firstJob = firstApp ? jobPostings.find(j => j.id === firstApp.job_id) : null
    setInterviewForm({
      application_id: firstApp?.id || '',
      job_id: firstApp?.job_id || '',
      candidate_name: firstApp?.candidate_name || '',
      interviewer_id: employees[0]?.id || '',
      interviewer_name: employees[0]?.profile?.full_name || '',
      type: 'technical',
      scheduled_at: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
      duration_min: 60,
      kit_name: firstJob ? `${firstJob.title} Interview` : 'Interview',
    })
    setShowInterviewModal(true)
  }

  function submitInterview() {
    if (!interviewForm.application_id || !interviewForm.interviewer_id || !interviewForm.scheduled_at) return
    addInterview({
      ...interviewForm,
      status: 'scheduled',
      score: null,
      feedback: null,
    })
    setShowInterviewModal(false)
  }

  function openFeedbackModal(interviewId: string) {
    const intv = interviews.find(i => i.id === interviewId)
    setFeedbackForm({
      interview_id: interviewId,
      score: intv?.score || 0,
      feedback: intv?.feedback || '',
    })
    setShowFeedbackModal(true)
  }

  function submitFeedback() {
    if (!feedbackForm.interview_id) return
    updateInterview(feedbackForm.interview_id, {
      score: feedbackForm.score,
      feedback: feedbackForm.feedback,
      status: 'completed',
    })
    setShowFeedbackModal(false)
  }

  // ---- Talent Pools ----
  function openNewPool() {
    setPoolForm({ name: '', description: '', category: 'sourced' })
    setShowPoolModal(true)
  }

  function submitPool() {
    if (!poolForm.name) return
    addTalentPool({
      name: poolForm.name,
      description: poolForm.description,
      category: poolForm.category,
      candidates: [],
    })
    setShowPoolModal(false)
  }

  // ---- AI Questions ----
  function openAIQuestions() {
    const firstJob = jobPostings.find(j => j.status === 'open')
    setQuestionsRole(firstJob?.title || 'Software Engineer')
    setQuestionsLevel('Senior')
    setShowQuestionsModal(true)
  }

  const aiQuestions = useMemo(() => {
    if (!showQuestionsModal || !questionsRole) return []
    return generateInterviewQuestions(questionsRole, questionsLevel)
  }, [showQuestionsModal, questionsRole, questionsLevel])

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
            {activeTab === 'interviews' && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={openAIQuestions}>
                  <MessageSquare size={14} /> {t('aiInterviewQuestions')}
                </Button>
                <Button size="sm" onClick={openNewInterview}>
                  <Plus size={14} /> {t('scheduleInterview')}
                </Button>
              </div>
            )}
            {activeTab === 'talent_pool' && (
              <Button size="sm" onClick={openNewPool}>
                <Plus size={14} /> {t('createPool')}
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

      {/* ========== INTERVIEWS TAB ========== */}
      {activeTab === 'interviews' && (
        <div className="space-y-6">
          {/* Panel Load Balancing */}
          {panelData.insights.length > 0 && (
            <AIAlertBanner insights={panelData.insights} className="mb-2" />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upcoming Interviews */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-t1">{t('upcomingInterviews')}</h3>
                  <Badge variant="info">{upcomingInterviews.length}</Badge>
                </div>
                {upcomingInterviews.length === 0 && (
                  <p className="text-xs text-t3 text-center py-8">{t('noInterviews')}</p>
                )}
                <div className="space-y-3">
                  {upcomingInterviews.map(intv => (
                    <div key={intv.id} className="flex items-center justify-between p-3 bg-canvas rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-tempo-100 flex items-center justify-center">
                          <Calendar size={16} className="text-tempo-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-t1">{intv.candidate_name}</p>
                          <p className="text-xs text-t3">{intv.interviewer_name} - {intv.kit_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-t1">{new Date(intv.scheduled_at).toLocaleDateString()}</p>
                        <p className="text-[0.6rem] text-t3">{new Date(intv.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {intv.duration_min}min</p>
                        <Badge variant="info" className="mt-1">{intv.type.replace(/_/g, ' ')}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-t1">{t('pastInterviews')}</h3>
                  <Badge>{pastInterviews.length}</Badge>
                </div>
                <div className="space-y-3">
                  {pastInterviews.map(intv => (
                    <div key={intv.id} className="flex items-center justify-between p-3 bg-canvas rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <Check size={16} className="text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-t1">{intv.candidate_name}</p>
                          <p className="text-xs text-t3">{intv.interviewer_name} - {intv.kit_name}</p>
                          {intv.feedback && (
                            <p className="text-xs text-t2 mt-1 line-clamp-1">{intv.feedback}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <p className="text-xs text-t3">{new Date(intv.scheduled_at).toLocaleDateString()}</p>
                        {intv.score && (
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star key={s} size={10} className={s <= (intv.score || 0) ? 'fill-tempo-600 text-tempo-600' : 'text-t3'} />
                            ))}
                          </div>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => openFeedbackModal(intv.id)}>
                          {t('viewFeedback')}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Panel Load Sidebar */}
            <div className="space-y-4">
              <Card>
                <h3 className="text-sm font-semibold text-t1 mb-3">{t('panelLoadBalancing')}</h3>
                <div className="space-y-3">
                  {panelData.interviewerLoad.map(il => (
                    <div key={il.id} className="flex items-center justify-between p-2 rounded-lg bg-canvas">
                      <div>
                        <p className="text-xs font-medium text-t1">{il.name}</p>
                        <p className="text-[0.6rem] text-t3">{il.count} {t('interviewCount').toLowerCase()} - {t('avgScore')}: {il.avgScore || '-'}</p>
                      </div>
                      <Badge variant={il.loadStatus === 'overloaded' ? 'error' : il.loadStatus === 'balanced' ? 'success' : 'default'}>
                        {t(il.loadStatus as 'overloaded' | 'balanced' | 'light')}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* ========== TALENT POOL TAB ========== */}
      {activeTab === 'talent_pool' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pool List */}
          <div className="space-y-3">
            {talentPools.length === 0 && (
              <div className="text-center py-12 text-sm text-t3">{t('noTalentPools')}</div>
            )}
            {talentPools.map(pool => (
              <Card
                key={pool.id}
                className={`cursor-pointer transition-colors ${selectedPoolId === pool.id ? 'ring-2 ring-tempo-500' : 'hover:bg-canvas/50'}`}
                onClick={() => setSelectedPoolId(pool.id)}
              >
                <div className="flex items-start justify-between mb-1">
                  <h3 className="text-sm font-semibold text-t1">{pool.name}</h3>
                  <Badge variant={pool.category === 'referred' ? 'success' : pool.category === 'sourced' ? 'info' : 'default'}>
                    {pool.category === 'referred' ? t('catReferred') : pool.category === 'sourced' ? t('catSourced') : t('catPastApplicants')}
                  </Badge>
                </div>
                <p className="text-xs text-t3 mb-2">{pool.description}</p>
                <div className="flex items-center gap-2">
                  <Users size={12} className="text-t3" />
                  <span className="text-xs text-t2">{t('candidatesInPool', { count: pool.candidates?.length || 0 })}</span>
                </div>
              </Card>
            ))}
          </div>

          {/* Pool Detail */}
          <div className="lg:col-span-2">
            {(() => {
              const pool = talentPools.find(p => p.id === selectedPoolId)
              if (!pool) return (
                <Card>
                  <div className="text-center py-12 text-sm text-t3">
                    {talentPools.length > 0 ? 'Select a talent pool to view candidates' : t('noTalentPools')}
                  </div>
                </Card>
              )
              return (
                <Card>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-t1">{pool.name}</h3>
                      <p className="text-xs text-t3">{pool.description}</p>
                    </div>
                    <Badge>{t('candidatesInPool', { count: pool.candidates?.length || 0 })}</Badge>
                  </div>
                  {(!pool.candidates || pool.candidates.length === 0) && (
                    <p className="text-xs text-t3 text-center py-8">{t('noCandidatesInPool')}</p>
                  )}
                  <div className="space-y-3">
                    {pool.candidates?.map((cand: { id: string; name: string; email: string; title: string; company: string; source: string; tags: string[]; notes: string; last_contacted: string | null; added_at: string }) => (
                      <div key={cand.id} className="p-3 bg-canvas rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-sm font-medium text-t1">{cand.name}</p>
                            <p className="text-xs text-t3">{cand.title} - {cand.company}</p>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => {
                            updateApplication(cand.id, { status: 'screening' })
                          }}>
                            <Send size={12} /> {t('reEngageCandidate')}
                          </Button>
                        </div>
                        <p className="text-xs text-t2 mb-2">{cand.notes}</p>
                        <div className="flex items-center gap-2 mb-2">
                          <Tag size={10} className="text-t3" />
                          <div className="flex flex-wrap gap-1">
                            {cand.tags?.map((tag: string) => (
                              <span key={tag} className="text-[0.6rem] bg-tempo-50 text-tempo-700 px-2 py-0.5 rounded-full">{tag}</span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-[0.6rem] text-t3">
                          <span>{t('source')}: {cand.source}</span>
                          <span>{t('lastContacted')}: {cand.last_contacted ? new Date(cand.last_contacted).toLocaleDateString() : t('neverContacted')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )
            })()}
          </div>
        </div>
      )}

      {/* ========== SCORECARDS TAB ========== */}
      {activeTab === 'scorecards' && (
        <div className="space-y-6">
          {/* Candidate Comparison */}
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-4">{t('candidateComparison')}</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-4 py-3">{t('candidate')}</th>
                    <th className="tempo-th text-left px-4 py-3">{t('tablePosition')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('avgScore')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('scoreCount', { count: 0 }).replace('0 ', '')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('recommendation')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('tableActions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {Object.entries(scoreCardsByCandidate).length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-sm text-t3">{t('noScorecards')}</td>
                    </tr>
                  )}
                  {Object.entries(scoreCardsByCandidate).map(([appId, data]) => {
                    const recs = data.cards.filter(c => c.recommendation).map(c => c.recommendation)
                    const topRec = recs.includes('strong_hire') ? 'strong_hire' : recs.includes('hire') ? 'hire' : recs.includes('no_hire') ? 'no_hire' : 'no_decision'
                    return (
                      <tr key={appId} className="hover:bg-canvas/50">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-t1">{data.candidate_name}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-t2">{data.job_title}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-sm font-bold ${data.avgScore >= 4 ? 'text-green-600' : data.avgScore >= 3 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {data.avgScore}/5
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-t2">{data.cards.length}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={topRec === 'strong_hire' ? 'success' : topRec === 'hire' ? 'info' : topRec === 'no_hire' ? 'error' : 'default'}>
                            {topRec === 'strong_hire' ? t('recStrongHire') : topRec === 'hire' ? t('recHire') : topRec === 'no_hire' ? t('recNoHire') : t('recNoDecision')}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button size="sm" variant="outline" onClick={() => setSelectedCandidateForSC(selectedCandidateForSC === appId ? null : appId)}>
                            {selectedCandidateForSC === appId ? tc('close') : tc('view')}
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Expanded Scorecard Detail */}
          {selectedCandidateForSC && scoreCardsByCandidate[selectedCandidateForSC] && (
            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-4">
                {t('calibrationView')} - {scoreCardsByCandidate[selectedCandidateForSC].candidate_name}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scoreCardsByCandidate[selectedCandidateForSC].cards.map(sc => (
                  <div key={sc.id} className="p-4 bg-canvas rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-medium text-t1">{sc.interviewer_name}</p>
                        <p className="text-xs text-t3">{sc.submitted_at ? new Date(sc.submitted_at).toLocaleDateString() : t('recNoDecision')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-tempo-600">{sc.overall_score}/5</p>
                        <Badge variant={sc.recommendation === 'strong_hire' ? 'success' : sc.recommendation === 'hire' ? 'info' : sc.recommendation === 'no_hire' ? 'error' : 'default'}>
                          {sc.recommendation === 'strong_hire' ? t('recStrongHire') : sc.recommendation === 'hire' ? t('recHire') : sc.recommendation === 'no_hire' ? t('recNoHire') : sc.recommendation === 'strong_no_hire' ? t('recStrongNoHire') : t('recNoDecision')}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {sc.criteria?.map((c: { name: string; score: number; weight: number; notes: string }, idx: number) => (
                        <div key={idx}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-t2">{c.name}</span>
                            <span className="font-medium text-t1">{c.score}/5 ({Math.round(c.weight * 100)}%)</span>
                          </div>
                          <Progress value={c.score * 20} />
                          {c.notes && <p className="text-[0.6rem] text-t3 mt-0.5">{c.notes}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ========== DEI ANALYTICS TAB ========== */}
      {activeTab === 'dei' && (
        <div className="space-y-6">
          {applications.length < 2 ? (
            <Card>
              <div className="text-center py-12 text-sm text-t3">{t('noApplicantsForDEI')}</div>
            </Card>
          ) : (
            <>
              {/* DEI Insights */}
              {deiData.insights.length > 0 && (
                <AIAlertBanner insights={deiData.insights} className="mb-2" />
              )}

              {/* Score + Funnel */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <h3 className="text-sm font-semibold text-t1 mb-3">{t('diversityScore')}</h3>
                  <div className="text-center">
                    <div className={`text-4xl font-bold ${deiData.overallScore >= 70 ? 'text-green-600' : deiData.overallScore >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {deiData.overallScore}%
                    </div>
                    <p className="text-xs text-t3 mt-1">{t('pipelineDiversity')}</p>
                  </div>
                </Card>

                <Card className="md:col-span-2">
                  <h3 className="text-sm font-semibold text-t1 mb-3">{t('funnelByDemographic')}</h3>
                  <div className="space-y-3">
                    {deiData.funnelData.map(fd => (
                      <div key={fd.stage}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-t2 capitalize">{fd.stage}</span>
                          <span className="text-t3">{fd.total}</span>
                        </div>
                        <div className="flex h-4 rounded-full overflow-hidden bg-canvas">
                          {Object.entries(fd.categories).map(([cat, count], idx) => {
                            const colors = ['bg-blue-500', 'bg-pink-500', 'bg-purple-500', 'bg-green-500', 'bg-yellow-500']
                            const pctVal = fd.total > 0 ? (count / fd.total) * 100 : 0
                            return (
                              <div
                                key={cat}
                                className={`${colors[idx % colors.length]} transition-all`}
                                style={{ width: `${pctVal}%` }}
                                title={`${cat}: ${count} (${Math.round(pctVal)}%)`}
                              />
                            )
                          })}
                        </div>
                        <div className="flex gap-3 mt-1">
                          {Object.entries(fd.categories).map(([cat, count], idx) => {
                            const dotColors = ['bg-blue-500', 'bg-pink-500', 'bg-purple-500', 'bg-green-500', 'bg-yellow-500']
                            return (
                              <span key={cat} className="flex items-center gap-1 text-[0.6rem] text-t3">
                                <span className={`w-1.5 h-1.5 rounded-full ${dotColors[idx % dotColors.length]}`} />
                                {cat}: {count}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Source Diversity */}
              <Card>
                <h3 className="text-sm font-semibold text-t1 mb-4">{t('sourceDiversity')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {deiData.sourceData.map(sd => (
                    <div key={sd.source} className="text-center p-3 bg-canvas rounded-lg">
                      <p className="text-xs font-medium text-t1 mb-1">{sd.source}</p>
                      <div className={`text-2xl font-bold ${sd.diversity_score >= 70 ? 'text-green-600' : sd.diversity_score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {sd.diversity_score}%
                      </div>
                      <p className="text-[0.6rem] text-t3">{sd.count} candidates</p>
                      <Progress value={sd.diversity_score} className="mt-2" />
                    </div>
                  ))}
                </div>
              </Card>

              {/* Bias Indicators */}
              <Card>
                <h3 className="text-sm font-semibold text-t1 mb-4">{t('biasIndicators')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-canvas rounded-lg">
                    <p className="text-xs text-t3 mb-1">{t('interviewToOfferRatio')}</p>
                    <p className="text-lg font-bold text-t1">
                      {applications.filter(a => (a.stage || a.status) === 'offer').length}:{applications.filter(a => (a.stage || a.status) === 'interview').length || 1}
                    </p>
                    <p className="text-[0.6rem] text-t3">Offer to interview conversion</p>
                  </div>
                  <div className="p-3 bg-canvas rounded-lg">
                    <p className="text-xs text-t3 mb-1">{t('genderDistribution')}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-3 rounded-full overflow-hidden bg-canvas flex">
                        <div className="bg-blue-500" style={{ width: '52%' }} />
                        <div className="bg-pink-500" style={{ width: '40%' }} />
                        <div className="bg-purple-500" style={{ width: '8%' }} />
                      </div>
                    </div>
                    <div className="flex gap-3 mt-1">
                      <span className="text-[0.6rem] text-t3 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" />Male 52%</span>
                      <span className="text-[0.6rem] text-t3 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-pink-500" />Female 40%</span>
                      <span className="text-[0.6rem] text-t3 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-500" />NB 8%</span>
                    </div>
                  </div>
                  <div className="p-3 bg-canvas rounded-lg">
                    <p className="text-xs text-t3 mb-1">{t('regionDistribution')}</p>
                    <div className="space-y-1 mt-1">
                      {['West Africa', 'East Africa', 'Southern Africa', 'Diaspora'].map((region, idx) => {
                        const pcts = [45, 30, 15, 10]
                        return (
                          <div key={region} className="flex items-center gap-2">
                            <span className="text-[0.6rem] text-t3 w-20">{region}</span>
                            <div className="flex-1 h-2 rounded-full bg-canvas overflow-hidden">
                              <div className="h-full bg-tempo-500 rounded-full" style={{ width: `${pcts[idx]}%` }} />
                            </div>
                            <span className="text-[0.6rem] text-t3 w-8 text-right">{pcts[idx]}%</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>
      )}

      {/* ---- OFFERS TAB ---- */}
      {activeTab === 'offers' && (
        <div className="space-y-6">
          {/* Offer Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard label={t('activeOffers')} value={offers.filter(o => o.status !== 'accepted' && o.status !== 'declined').length} icon={<FileCheck size={20} />} />
            <StatCard label={t('acceptanceRate')} value={`${offers.length > 0 ? Math.round((offers.filter(o => o.status === 'accepted').length / offers.length) * 100) : 0}%`} icon={<CheckCircle2 size={20} />} />
            <StatCard label={t('offerSent')} value={offers.filter(o => o.status === 'sent' || o.status === 'viewed').length} icon={<Send size={20} />} />
            <StatCard label={t('offerNegotiating')} value={offers.filter(o => o.status === 'negotiating').length} icon={<MessageSquare size={20} />} />
          </div>

          {/* Offer List */}
          {offers.length === 0 ? (
            <Card><div className="text-center py-12 text-sm text-t3">{t('noOffers')}</div></Card>
          ) : (
            <div className="space-y-4">
              {offers.map(offer => {
                const statusColors: Record<string, string> = {
                  draft: 'default', sent: 'info', viewed: 'warning', accepted: 'success', declined: 'danger', negotiating: 'warning',
                }
                const statusLabels: Record<string, string> = {
                  draft: t('offerDraft'), sent: t('offerSent'), viewed: t('offerViewed'), accepted: t('offerAccepted'), declined: t('offerDeclined'), negotiating: t('offerNegotiating'),
                }
                const approvedCount = offer.approval_chain?.filter((a: any) => a.status === 'approved').length || 0
                const totalApprovers = offer.approval_chain?.length || 0

                return (
                  <Card key={offer.id}>
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-sm font-semibold text-t1">{offer.candidate_name}</h3>
                          <p className="text-xs text-t3">{offer.role} &middot; {getDepartmentName(offer.department_id)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={statusColors[offer.status] as any || 'default'}>{statusLabels[offer.status] || offer.status}</Badge>
                          {offer.status === 'draft' && (
                            <Button size="sm" onClick={() => updateOffer(offer.id, { status: 'sent', sent_at: new Date().toISOString() })}><Send size={12} className="mr-1" />{tc('send')}</Button>
                          )}
                          {offer.status === 'sent' && (
                            <Button size="sm" variant="secondary" onClick={() => updateOffer(offer.id, { status: 'viewed', viewed_at: new Date().toISOString() })}><Eye size={12} className="mr-1" />Mark Viewed</Button>
                          )}
                          {(offer.status === 'viewed' || offer.status === 'negotiating') && (
                            <div className="flex gap-1">
                              <Button size="sm" onClick={() => updateOffer(offer.id, { status: 'accepted' })}><CheckCircle2 size={12} className="mr-1" />{t('offerAccepted')}</Button>
                              <Button size="sm" variant="danger" onClick={() => updateOffer(offer.id, { status: 'declined' })}><XCircle size={12} className="mr-1" />{t('offerDeclined')}</Button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
                        <div className="bg-canvas rounded-lg p-2">
                          <p className="text-[0.6rem] text-t3">{t('offerSalary')}</p>
                          <p className="text-sm font-semibold text-t1">${offer.salary?.toLocaleString()}</p>
                        </div>
                        <div className="bg-canvas rounded-lg p-2">
                          <p className="text-[0.6rem] text-t3">{t('offerEquity')}</p>
                          <p className="text-sm font-semibold text-t1">{(offer.equity_shares || 0).toLocaleString()} shares</p>
                        </div>
                        <div className="bg-canvas rounded-lg p-2">
                          <p className="text-[0.6rem] text-t3">{t('offerSigningBonus')}</p>
                          <p className="text-sm font-semibold text-t1">${(offer.signing_bonus || 0).toLocaleString()}</p>
                        </div>
                        <div className="bg-canvas rounded-lg p-2">
                          <p className="text-[0.6rem] text-t3">{t('offerStartDate')}</p>
                          <p className="text-sm font-semibold text-t1">{offer.start_date}</p>
                        </div>
                        <div className="bg-canvas rounded-lg p-2">
                          <p className="text-[0.6rem] text-t3">{t('offerBenefits')}</p>
                          <p className="text-xs text-t1">{offer.benefits_package}</p>
                        </div>
                      </div>

                      {/* Approval chain */}
                      <div className="flex items-center gap-4 mb-3">
                        <p className="text-xs font-medium text-t2">{t('offerApprovalChain')}</p>
                        <div className="flex items-center gap-2">
                          {offer.approval_chain?.map((step: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-1">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[0.5rem] font-bold ${step.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                                {step.status === 'approved' ? <Check size={10} /> : idx + 1}
                              </div>
                              <span className="text-[0.6rem] text-t3">{step.role}</span>
                              {idx < (offer.approval_chain?.length || 0) - 1 && <ArrowRight size={10} className="text-t3 mx-1" />}
                            </div>
                          ))}
                        </div>
                        <Badge variant={approvedCount === totalApprovers ? 'success' : 'default'}>
                          {approvedCount}/{totalApprovers} {t('offerApproved')}
                        </Badge>
                      </div>

                      {/* Offer vs Market */}
                      {offer.market_p50 && (
                        <div className="bg-canvas rounded-lg p-3">
                          <p className="text-xs font-medium text-t2 mb-2">{t('offerVsMarket')}</p>
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <div className="relative h-6 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div className="absolute left-0 top-0 h-full bg-blue-200 dark:bg-blue-900/40 rounded-full" style={{ width: `${Math.min(100, ((offer.market_p75 || 0) / ((offer.market_p75 || 1) * 1.2)) * 100)}%` }} />
                                <div className="absolute left-0 top-0 h-full bg-blue-300 dark:bg-blue-800/50 rounded-full" style={{ width: `${Math.min(100, ((offer.market_p50 || 0) / ((offer.market_p75 || 1) * 1.2)) * 100)}%` }} />
                                <div className="absolute top-0.5 h-5 w-0.5 bg-green-600 dark:bg-green-400" style={{ left: `${Math.min(100, ((offer.salary || 0) / ((offer.market_p75 || 1) * 1.2)) * 100)}%` }} />
                              </div>
                              <div className="flex justify-between mt-1">
                                <span className="text-[0.55rem] text-t3">{t('marketP50')}: ${offer.market_p50?.toLocaleString()}</span>
                                <span className="text-[0.55rem] text-green-600 dark:text-green-400 font-medium">Offer: ${offer.salary?.toLocaleString()}</span>
                                <span className="text-[0.55rem] text-t3">{t('marketP75')}: ${offer.market_p75?.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
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
            <Input label={t('salaryMin')} type="number" min={0} value={jobForm.salary_min} onChange={(e) => setJobForm({ ...jobForm, salary_min: Number(e.target.value) })} />
            <Input label={t('salaryMax')} type="number" min={0} value={jobForm.salary_max} onChange={(e) => setJobForm({ ...jobForm, salary_max: Number(e.target.value) })} />
          </div>
          <Textarea label={t('descriptionLabel')} placeholder={t('descriptionPlaceholder')} rows={4} value={jobForm.description} onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })} />
          <Textarea label={t('requirementsLabel')} placeholder={t('requirementsPlaceholder')} rows={4} value={jobForm.requirements} onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowJobModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitJob}>{editingJob ? tc('saveChanges') : t('postJobButton')}</Button>
          </div>
        </div>
      </Modal>

      {/* Add Candidate Modal */}
      <Modal open={showAppModal} onClose={() => setShowAppModal(false)} title={t('addCandidateModal')}>
        <div className="space-y-4">
          <Select label={t('jobPosting')} value={appForm.job_id} onChange={(e) => setAppForm({ ...appForm, job_id: e.target.value })} options={jobPostings.filter(j => j.status === 'open').map(j => ({ value: j.id, label: j.title }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('candidateName')} placeholder={t('candidateNamePlaceholder')} value={appForm.candidate_name} onChange={(e) => setAppForm({ ...appForm, candidate_name: e.target.value })} />
            <Input label={t('candidateEmail')} type="email" placeholder={t('candidateEmailPlaceholder')} value={appForm.candidate_email} onChange={(e) => setAppForm({ ...appForm, candidate_email: e.target.value })} />
          </div>
          <Input label={t('resumeUrl')} placeholder={t('resumeUrlPlaceholder')} value={appForm.resume_url} onChange={(e) => setAppForm({ ...appForm, resume_url: e.target.value })} />
          <Textarea label={t('coverLetter')} placeholder={t('coverLetterPlaceholder')} rows={3} value={appForm.cover_letter} onChange={(e) => setAppForm({ ...appForm, cover_letter: e.target.value })} />
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
          <Textarea label={t('notesOptional')} placeholder={t('notesPlaceholder')} rows={2} value={stageForm.notes} onChange={(e) => setStageForm({ ...stageForm, notes: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowStageModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitStageChange}>{t('moveStage')}</Button>
          </div>
        </div>
      </Modal>

      {/* Career Site Preview Modal */}
      <Modal open={showPreviewModal} onClose={() => setShowPreviewModal(false)} title={t('preview')} size="xl">
        <div className="bg-canvas rounded-lg overflow-hidden">
          <div className={`p-8 text-center ${careerForm.theme === 'modern' ? 'bg-gradient-to-r from-tempo-600 to-tempo-800' : careerForm.theme === 'creative' ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-tempo-700'} text-white`}>
            <h2 className="text-xl font-bold mb-2">{careerForm.hero_title || 'Your Company'}</h2>
            <p className="text-sm opacity-80">{careerForm.hero_subtitle || 'Join our team'}</p>
          </div>
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
                      <input type="checkbox" checked={selectedBoards.includes(board.id)} onChange={() => toggleBoard(board.id)} className="rounded border-divider" />
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

      {/* Schedule Interview Modal */}
      <Modal open={showInterviewModal} onClose={() => setShowInterviewModal(false)} title={t('scheduleInterview')}>
        <div className="space-y-4">
          <Select
            label={t('selectCandidate')}
            value={interviewForm.application_id}
            onChange={(e) => {
              const app = applications.find(a => a.id === e.target.value)
              setInterviewForm({
                ...interviewForm,
                application_id: e.target.value,
                job_id: app?.job_id || '',
                candidate_name: app?.candidate_name || '',
              })
            }}
            options={applications.map(a => ({ value: a.id, label: `${a.candidate_name} - ${jobPostings.find(j => j.id === a.job_id)?.title || ''}` }))}
          />
          <Select
            label={t('selectInterviewer')}
            value={interviewForm.interviewer_id}
            onChange={(e) => {
              const emp = employees.find(em => em.id === e.target.value)
              setInterviewForm({
                ...interviewForm,
                interviewer_id: e.target.value,
                interviewer_name: emp?.profile?.full_name || '',
              })
            }}
            options={employees.map(e => ({ value: e.id, label: `${e.profile.full_name} - ${e.job_title}` }))}
          />
          <Select
            label={t('interviewType')}
            value={interviewForm.type}
            onChange={(e) => setInterviewForm({ ...interviewForm, type: e.target.value })}
            options={[
              { value: 'technical', label: t('typeTechnical') },
              { value: 'culture', label: t('typeCulture') },
              { value: 'panel', label: t('typePanel') },
              { value: 'phone_screen', label: t('typePhoneScreen') },
            ]}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('scheduledAt')} type="datetime-local" value={interviewForm.scheduled_at} onChange={(e) => setInterviewForm({ ...interviewForm, scheduled_at: e.target.value })} />
            <Input label={t('durationMin')} type="number" min={15} value={interviewForm.duration_min} onChange={(e) => setInterviewForm({ ...interviewForm, duration_min: Number(e.target.value) })} />
          </div>
          <Input label={t('interviewKit')} value={interviewForm.kit_name} onChange={(e) => setInterviewForm({ ...interviewForm, kit_name: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowInterviewModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitInterview}>{t('addInterviewButton')}</Button>
          </div>
        </div>
      </Modal>

      {/* Interview Feedback Modal */}
      <Modal open={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} title={t('interviewFeedback')}>
        <div className="space-y-4">
          {(() => {
            const intv = interviews.find(i => i.id === feedbackForm.interview_id)
            return intv ? (
              <div className="p-3 bg-canvas rounded-lg mb-2">
                <p className="text-sm font-medium text-t1">{intv.candidate_name}</p>
                <p className="text-xs text-t3">{intv.interviewer_name} - {intv.kit_name} - {new Date(intv.scheduled_at).toLocaleDateString()}</p>
              </div>
            ) : null
          })()}
          <div>
            <label className="text-xs font-medium text-t1 mb-2 block">{t('interviewScore')}</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} onClick={() => setFeedbackForm({ ...feedbackForm, score: s })} className="p-1">
                  <Star size={20} className={s <= feedbackForm.score ? 'fill-tempo-600 text-tempo-600' : 'text-t3 hover:text-tempo-300'} />
                </button>
              ))}
            </div>
          </div>
          <Textarea
            label={t('interviewFeedback')}
            placeholder={t('feedbackPlaceholder')}
            rows={4}
            value={feedbackForm.feedback}
            onChange={(e) => setFeedbackForm({ ...feedbackForm, feedback: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowFeedbackModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitFeedback}>{t('submitFeedback')}</Button>
          </div>
        </div>
      </Modal>

      {/* Create Talent Pool Modal */}
      <Modal open={showPoolModal} onClose={() => setShowPoolModal(false)} title={t('createPool')} size="sm">
        <div className="space-y-4">
          <Input label={t('poolName')} value={poolForm.name} onChange={(e) => setPoolForm({ ...poolForm, name: e.target.value })} />
          <Textarea label={t('poolDescription')} rows={2} value={poolForm.description} onChange={(e) => setPoolForm({ ...poolForm, description: e.target.value })} />
          <Select
            label={t('poolCategory')}
            value={poolForm.category}
            onChange={(e) => setPoolForm({ ...poolForm, category: e.target.value })}
            options={[
              { value: 'referred', label: t('catReferred') },
              { value: 'sourced', label: t('catSourced') },
              { value: 'past_applicants', label: t('catPastApplicants') },
            ]}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowPoolModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitPool}>{t('createPool')}</Button>
          </div>
        </div>
      </Modal>

      {/* AI Interview Questions Modal */}
      <Modal open={showQuestionsModal} onClose={() => setShowQuestionsModal(false)} title={t('aiInterviewQuestions')} size="xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label={t('tablePosition')}
              value={questionsRole}
              onChange={(e) => setQuestionsRole(e.target.value)}
              options={jobPostings.filter(j => j.status === 'open').map(j => ({ value: j.title, label: j.title }))}
            />
            <Select
              label="Level"
              value={questionsLevel}
              onChange={(e) => setQuestionsLevel(e.target.value)}
              options={[
                { value: 'Junior', label: 'Junior' },
                { value: 'Mid', label: 'Mid' },
                { value: 'Senior', label: 'Senior' },
                { value: 'Director', label: 'Director' },
                { value: 'Executive', label: 'Executive' },
              ]}
            />
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {aiQuestions.map((q, idx) => (
              <div key={idx} className="p-3 bg-canvas rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="info">{q.category}</Badge>
                  <span className="text-[0.6rem] text-t3">{t('evaluatesLabel')}: {q.evaluates}</span>
                </div>
                <p className="text-sm text-t1 mb-1">{q.question}</p>
                <p className="text-xs text-t3"><span className="font-medium">{t('followUp')}:</span> {q.followUp}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-2">
            <Button variant="secondary" onClick={() => setShowQuestionsModal(false)}>{tc('close')}</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
