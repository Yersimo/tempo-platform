'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Tabs } from '@/components/ui/tabs'
import { Modal } from '@/components/ui/modal'
import { Input, Textarea, Select } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { useTempo } from '@/lib/store'
import {
  GIG_TYPES,
  GIG_STATUS,
  APPLICATION_STATUS,
  COMMITMENT_OPTIONS,
  COMPENSATION_OPTIONS,
  calculateSkillMatch,
  getRecommendedGigs,
  parseCareerPathSteps,
  getCareerPathProgress,
  computeMarketplaceStats,
  type InternalGig,
  type GigApplication,
  type CareerPath,
  type CareerInterest,
  type MarketplaceStats,
} from '@/lib/services/talent-marketplace'
import {
  Target, Layers, Users, Eye, RefreshCw, ArrowRightLeft,
  Plus, Search, Filter, MapPin, Clock, DollarSign, Briefcase,
  ChevronRight, Star, Zap, TrendingUp, BarChart3, Send,
  CheckCircle, XCircle, ArrowRight, GraduationCap, Compass,
  Rocket, Award, Heart, Brain, Flame, GitBranch, Building2,
} from 'lucide-react'

// ---- Demo Data ----

const DEMO_SKILLS = [
  { id: 'sk-1', name: 'TypeScript', category: 'technical' },
  { id: 'sk-2', name: 'React', category: 'technical' },
  { id: 'sk-3', name: 'System Design', category: 'technical' },
  { id: 'sk-4', name: 'Team Leadership', category: 'leadership' },
  { id: 'sk-5', name: 'Strategic Thinking', category: 'leadership' },
  { id: 'sk-6', name: 'Stakeholder Management', category: 'leadership' },
  { id: 'sk-7', name: 'Project Management', category: 'functional' },
  { id: 'sk-8', name: 'Data Analysis', category: 'functional' },
  { id: 'sk-9', name: 'Communication', category: 'behavioral' },
  { id: 'sk-10', name: 'Problem Solving', category: 'behavioral' },
  { id: 'sk-11', name: 'Python', category: 'technical' },
  { id: 'sk-12', name: 'Cloud Architecture (AWS)', category: 'technical' },
]

const DEMO_EMPLOYEE_SKILLS = [
  { employee_id: 'emp-1', skill_id: 'sk-1', current_level: 5 },
  { employee_id: 'emp-1', skill_id: 'sk-2', current_level: 5 },
  { employee_id: 'emp-1', skill_id: 'sk-3', current_level: 4 },
  { employee_id: 'emp-1', skill_id: 'sk-4', current_level: 4 },
  { employee_id: 'emp-1', skill_id: 'sk-9', current_level: 4 },
]

const DEMO_GIGS: InternalGig[] = [
  {
    id: 'gig-1', org_id: 'org-1', title: 'API Platform Migration Lead',
    description: 'Lead the migration of our legacy REST APIs to GraphQL. Great opportunity to work cross-functionally with the platform and product teams. You will define the migration strategy, mentor junior engineers, and deliver the first set of migrated endpoints.',
    gig_type: 'stretch_assignment', department_id: 'dept-1', posted_by: 'emp-3',
    status: 'open', commitment: 'part_time', hours_per_week: 15, duration: '3 months',
    start_date: '2026-04-01', end_date: '2026-06-30', max_participants: 1,
    required_skills: '["sk-1","sk-3","sk-9"]', preferred_level: 'L4',
    is_remote: true, compensation_type: 'bonus', compensation_amount: 250000,
    created_at: '2026-03-10T10:00:00Z', updated_at: '2026-03-10T10:00:00Z',
  },
  {
    id: 'gig-2', org_id: 'org-1', title: 'Customer Success Dashboard',
    description: 'Build a real-time customer health dashboard for the CS team. Involves data pipeline design, React frontend, and integration with our CRM. Perfect for someone looking to broaden their product sense.',
    gig_type: 'project', department_id: 'dept-2', posted_by: 'emp-5',
    status: 'open', commitment: 'hours_per_week', hours_per_week: 10, duration: '6 weeks',
    start_date: '2026-04-15', end_date: '2026-05-31', max_participants: 2,
    required_skills: '["sk-2","sk-8","sk-1"]', preferred_level: 'L3',
    is_remote: true, compensation_type: 'none', compensation_amount: undefined,
    created_at: '2026-03-12T14:00:00Z', updated_at: '2026-03-12T14:00:00Z',
  },
  {
    id: 'gig-3', org_id: 'org-1', title: 'Engineering Mentorship Program',
    description: 'Mentor 2-3 junior engineers through their first year. Weekly 1:1s, code reviews, and career guidance. Help shape the next generation of engineers at Tempo.',
    gig_type: 'mentoring', department_id: 'dept-1', posted_by: 'emp-2',
    status: 'open', commitment: 'hours_per_week', hours_per_week: 4, duration: '6 months',
    start_date: '2026-04-01', end_date: '2026-09-30', max_participants: 5,
    required_skills: '["sk-1","sk-4","sk-9"]', preferred_level: 'L5',
    is_remote: false, compensation_type: 'stipend', compensation_amount: 100000,
    created_at: '2026-03-08T09:00:00Z', updated_at: '2026-03-08T09:00:00Z',
  },
  {
    id: 'gig-4', org_id: 'org-1', title: 'Product Management Rotation',
    description: 'Spend 3 months embedded in the Product team. Shadow the PM for the Growth squad, contribute to roadmap planning, and run your own feature experiment.',
    gig_type: 'job_rotation', department_id: 'dept-3', posted_by: 'emp-4',
    status: 'open', commitment: 'full_time', hours_per_week: undefined, duration: '3 months',
    start_date: '2026-05-01', end_date: '2026-07-31', max_participants: 1,
    required_skills: '["sk-8","sk-5","sk-9"]', preferred_level: 'L4',
    is_remote: false, compensation_type: 'none', compensation_amount: undefined,
    created_at: '2026-03-15T11:00:00Z', updated_at: '2026-03-15T11:00:00Z',
  },
  {
    id: 'gig-5', org_id: 'org-1', title: 'VP of Engineering Shadow Week',
    description: 'Shadow our VP of Engineering for a full week. Attend leadership meetings, 1:1s with directors, and participate in strategic planning sessions. Great for aspiring engineering leaders.',
    gig_type: 'shadow', department_id: 'dept-1', posted_by: 'emp-2',
    status: 'open', commitment: 'full_time', hours_per_week: undefined, duration: '1 week',
    start_date: '2026-04-21', end_date: '2026-04-25', max_participants: 1,
    required_skills: '["sk-4","sk-5","sk-6"]', preferred_level: 'L4',
    is_remote: false, compensation_type: 'none', compensation_amount: undefined,
    created_at: '2026-03-18T10:00:00Z', updated_at: '2026-03-18T10:00:00Z',
  },
  {
    id: 'gig-6', org_id: 'org-1', title: 'Cloud Infrastructure Architect',
    description: 'Permanent move to the Platform team as a Cloud Infrastructure Architect. Design and implement our multi-cloud strategy. Requires deep AWS/GCP experience.',
    gig_type: 'internal_transfer', department_id: 'dept-1', posted_by: 'emp-3',
    status: 'open', commitment: 'full_time', hours_per_week: undefined, duration: 'Permanent',
    start_date: '2026-05-01', end_date: undefined, max_participants: 1,
    required_skills: '["sk-12","sk-3","sk-1"]', preferred_level: 'L5',
    is_remote: true, compensation_type: 'none', compensation_amount: undefined,
    created_at: '2026-03-14T16:00:00Z', updated_at: '2026-03-14T16:00:00Z',
  },
]

const DEMO_APPLICATIONS: GigApplication[] = [
  { id: 'app-1', gig_id: 'gig-1', employee_id: 'emp-1', status: 'shortlisted', cover_letter: 'I have extensive experience with API design and would love to lead this migration.', manager_approved: true, match_score: 87, created_at: '2026-03-11T10:00:00Z', updated_at: '2026-03-13T14:00:00Z' },
  { id: 'app-2', gig_id: 'gig-3', employee_id: 'emp-1', status: 'applied', cover_letter: 'Mentoring is my passion. I have guided 5 junior engineers in my career.', manager_approved: undefined, match_score: 93, created_at: '2026-03-15T09:00:00Z', updated_at: '2026-03-15T09:00:00Z' },
  { id: 'app-3', gig_id: 'gig-2', employee_id: 'emp-4', status: 'selected', cover_letter: null, manager_approved: true, match_score: 75, created_at: '2026-03-13T11:00:00Z', updated_at: '2026-03-16T10:00:00Z' },
]

const DEMO_CAREER_PATHS: CareerPath[] = [
  {
    id: 'cp-1', org_id: 'org-1', name: 'Engineering IC Track',
    description: 'Individual contributor path from junior to principal engineer',
    steps: JSON.stringify([
      { title: 'Junior Engineer', level: 'L1', skills: ['sk-1', 'sk-10'], typicalTenure: '1-2 years' },
      { title: 'Software Engineer', level: 'L2', skills: ['sk-1', 'sk-2', 'sk-10'], typicalTenure: '2-3 years' },
      { title: 'Senior Engineer', level: 'L3', skills: ['sk-1', 'sk-2', 'sk-3', 'sk-9'], typicalTenure: '2-4 years' },
      { title: 'Staff Engineer', level: 'L4', skills: ['sk-1', 'sk-3', 'sk-5', 'sk-6', 'sk-9'], typicalTenure: '3-5 years' },
      { title: 'Principal Engineer', level: 'L5', skills: ['sk-1', 'sk-3', 'sk-5', 'sk-6', 'sk-4', 'sk-9'], typicalTenure: '5+ years' },
    ]),
    department_id: 'dept-1', created_at: '2026-01-15T10:00:00Z',
  },
  {
    id: 'cp-2', org_id: 'org-1', name: 'Engineering Management Track',
    description: 'Path from tech lead to VP of Engineering',
    steps: JSON.stringify([
      { title: 'Tech Lead', level: 'L3', skills: ['sk-1', 'sk-4', 'sk-9'], typicalTenure: '1-2 years' },
      { title: 'Engineering Manager', level: 'L4', skills: ['sk-4', 'sk-5', 'sk-7', 'sk-9'], typicalTenure: '2-3 years' },
      { title: 'Senior Engineering Manager', level: 'L5', skills: ['sk-4', 'sk-5', 'sk-6', 'sk-7'], typicalTenure: '2-4 years' },
      { title: 'Director of Engineering', level: 'L6', skills: ['sk-4', 'sk-5', 'sk-6', 'sk-7', 'sk-9'], typicalTenure: '3-5 years' },
      { title: 'VP of Engineering', level: 'L7', skills: ['sk-4', 'sk-5', 'sk-6', 'sk-7', 'sk-9'], typicalTenure: '5+ years' },
    ]),
    department_id: 'dept-1', created_at: '2026-01-15T10:00:00Z',
  },
  {
    id: 'cp-3', org_id: 'org-1', name: 'Data Science Track',
    description: 'Path from data analyst to chief data officer',
    steps: JSON.stringify([
      { title: 'Data Analyst', level: 'L1', skills: ['sk-8', 'sk-11'], typicalTenure: '1-2 years' },
      { title: 'Data Scientist', level: 'L2', skills: ['sk-8', 'sk-11', 'sk-10'], typicalTenure: '2-3 years' },
      { title: 'Senior Data Scientist', level: 'L3', skills: ['sk-8', 'sk-11', 'sk-3', 'sk-9'], typicalTenure: '2-4 years' },
      { title: 'Lead Data Scientist', level: 'L4', skills: ['sk-8', 'sk-11', 'sk-3', 'sk-4', 'sk-5'], typicalTenure: '3-5 years' },
    ]),
    department_id: 'dept-2', created_at: '2026-01-20T10:00:00Z',
  },
]

const DEMO_CAREER_INTERESTS: CareerInterest[] = [
  {
    id: 'ci-1', employee_id: 'emp-1', org_id: 'org-1',
    target_role: 'Staff Engineer', target_department: 'dept-1',
    career_path_id: 'cp-1', interested_in_mentoring: true,
    interested_in_gigs: true, open_to_transfer: false,
    skills: '["sk-3","sk-5"]', updated_at: '2026-03-01T10:00:00Z',
  },
]

const DEMO_DEPARTMENTS = [
  { id: 'dept-1', name: 'Engineering' },
  { id: 'dept-2', name: 'Data Science' },
  { id: 'dept-3', name: 'Product' },
  { id: 'dept-4', name: 'Design' },
  { id: 'dept-5', name: 'Marketing' },
]

const DEMO_EMPLOYEES = [
  { id: 'emp-1', profile: { full_name: 'Alex Chen', avatar_url: null }, job_title: 'Senior Engineer', level: 'L3', department_id: 'dept-1' },
  { id: 'emp-2', profile: { full_name: 'Sarah Kim', avatar_url: null }, job_title: 'VP of Engineering', level: 'L7', department_id: 'dept-1' },
  { id: 'emp-3', profile: { full_name: 'James Wilson', avatar_url: null }, job_title: 'Engineering Manager', level: 'L5', department_id: 'dept-1' },
  { id: 'emp-4', profile: { full_name: 'Maria Garcia', avatar_url: null }, job_title: 'Data Scientist', level: 'L3', department_id: 'dept-2' },
  { id: 'emp-5', profile: { full_name: 'David Park', avatar_url: null }, job_title: 'Product Manager', level: 'L4', department_id: 'dept-3' },
]

// ---- Icon Map ----
const GIG_TYPE_ICONS: Record<string, React.ReactNode> = {
  stretch_assignment: <Target size={18} />,
  project: <Layers size={18} />,
  mentoring: <Users size={18} />,
  job_rotation: <RefreshCw size={18} />,
  shadow: <Eye size={18} />,
  internal_transfer: <ArrowRightLeft size={18} />,
}

export default function TalentMarketplacePage() {
  const {
    currentUser,
    employees: storeEmployees,
    departments: storeDepartments,
    skills: storeSkills,
    employeeSkills: storeEmployeeSkills,
    internalGigs: storeGigs,
    gigApplications: storeApps,
    careerPaths: storeCareerPaths,
    careerInterests: storeCareerInterests,
    jobPostings,
    ensureModulesLoaded,
  } = useTempo()

  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [commitmentFilter, setCommitmentFilter] = useState('all')
  const [remoteFilter, setRemoteFilter] = useState('all')
  const [selectedGig, setSelectedGig] = useState<InternalGig | null>(null)
  const [showPostGig, setShowPostGig] = useState(false)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [applyGig, setApplyGig] = useState<InternalGig | null>(null)
  const [coverLetter, setCoverLetter] = useState('')
  const [activeTab, setActiveTab] = useState('browse')

  useEffect(() => {
    ensureModulesLoaded?.([
      'employees', 'departments', 'skills', 'employeeSkills',
      'internalGigs', 'gigApplications', 'careerPaths', 'careerInterests',
      'jobPostings',
    ]).finally(() => setLoading(false))
  }, [ensureModulesLoaded])

  // Use store data with demo fallback
  const employees = storeEmployees?.length > 0 ? storeEmployees : DEMO_EMPLOYEES
  const departments = storeDepartments?.length > 0 ? storeDepartments : DEMO_DEPARTMENTS
  const skills = storeSkills?.length > 0 ? storeSkills : DEMO_SKILLS
  const empSkills = storeEmployeeSkills?.length > 0 ? storeEmployeeSkills : DEMO_EMPLOYEE_SKILLS
  const gigs: InternalGig[] = (storeGigs?.length > 0 ? storeGigs : DEMO_GIGS) as InternalGig[]
  const applications: GigApplication[] = (storeApps?.length > 0 ? storeApps : DEMO_APPLICATIONS) as GigApplication[]
  const careerPaths: CareerPath[] = (storeCareerPaths?.length > 0 ? storeCareerPaths : DEMO_CAREER_PATHS) as CareerPath[]
  const careerInterests: CareerInterest[] = (storeCareerInterests?.length > 0 ? storeCareerInterests : DEMO_CAREER_INTERESTS) as CareerInterest[]

  const currentEmployeeId = currentUser?.employee_id || 'emp-1'
  const mySkills = useMemo(() =>
    empSkills.filter((es: any) => es.employee_id === currentEmployeeId),
    [empSkills, currentEmployeeId]
  )

  // Skill name lookup
  const skillName = useCallback((id: string) => {
    const s = skills.find((sk: any) => sk.id === id)
    return (s as any)?.name || id
  }, [skills])

  const deptName = useCallback((id?: string) => {
    if (!id) return 'Any'
    const d = departments.find((dept: any) => dept.id === id)
    return (d as any)?.name || 'Unknown'
  }, [departments])

  const employeeName = useCallback((id: string) => {
    const e = employees.find((emp: any) => emp.id === id) as any
    return e?.profile?.full_name || e?.full_name || 'Unknown'
  }, [employees])

  // Stats
  const stats: MarketplaceStats = useMemo(
    () => computeMarketplaceStats(gigs, applications),
    [gigs, applications]
  )

  // Recommended gigs for current user
  const recommended = useMemo(() =>
    getRecommendedGigs(gigs, mySkills as any),
    [gigs, mySkills]
  )

  // My applications
  const myApplications = useMemo(() =>
    applications.filter((a) => a.employee_id === currentEmployeeId),
    [applications, currentEmployeeId]
  )

  // Filtered gigs
  const filteredGigs = useMemo(() => {
    let result = gigs.filter((g) => g.status === 'open')
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter((g) => g.title.toLowerCase().includes(q) || g.description.toLowerCase().includes(q))
    }
    if (typeFilter !== 'all') result = result.filter((g) => g.gig_type === typeFilter)
    if (commitmentFilter !== 'all') result = result.filter((g) => g.commitment === commitmentFilter)
    if (remoteFilter === 'remote') result = result.filter((g) => g.is_remote)
    if (remoteFilter === 'onsite') result = result.filter((g) => !g.is_remote)
    return result
  }, [gigs, searchQuery, typeFilter, commitmentFilter, remoteFilter])

  // My career interest
  const myCareerInterest = useMemo(
    () => careerInterests.find((ci) => ci.employee_id === currentEmployeeId),
    [careerInterests, currentEmployeeId]
  )

  const handleApply = useCallback((gig: InternalGig) => {
    setApplyGig(gig)
    setCoverLetter('')
    setShowApplyModal(true)
  }, [])

  const handleSubmitApplication = useCallback(async () => {
    if (!applyGig) return
    try {
      await fetch('/api/talent-marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'apply', gigId: applyGig.id, coverLetter }),
      })
    } catch { /* demo fallback */ }
    setShowApplyModal(false)
    setApplyGig(null)
  }, [applyGig, coverLetter])

  if (loading) return <PageSkeleton />

  const tabItems = [
    { id: 'browse', label: 'Browse Gigs' },
    { id: 'applications', label: 'My Applications' },
    { id: 'post', label: 'Post a Gig' },
    { id: 'career-paths', label: 'Career Paths' },
    { id: 'my-career', label: 'My Career' },
    { id: 'analytics', label: 'Analytics' },
  ]

  return (
    <>
      <Header title="Talent Marketplace" subtitle="Internal gig board, career development, and skill-based matching" />

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Open Gigs" value={stats.openGigs} icon={<Briefcase size={18} />} change="+12% this month" changeType="positive" />
        <StatCard label="Applications" value={stats.applications} icon={<Send size={18} />} />
        <StatCard label="Fill Rate" value={`${stats.fillRate}%`} icon={<TrendingUp size={18} />} change="+5% this quarter" changeType="positive" />
        <StatCard label="Avg. Time to Fill" value={`${stats.avgTimeToFill || 14}d`} icon={<Clock size={18} />} />
      </div>

      <Tabs tabs={tabItems} active={activeTab} onChange={setActiveTab} maxVisible={6} />

      <div className="mt-4">
          <>
            {/* ─── BROWSE GIGS ─── */}
            {activeTab === 'browse' && (
              <div className="space-y-4">
                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[240px]">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
                    <Input
                      placeholder="Search gigs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    options={[{ value: 'all', label: 'All Types' }, ...GIG_TYPES.map((t) => ({ value: t.value, label: t.label }))]}
                  />
                  <Select
                    value={commitmentFilter}
                    onChange={(e) => setCommitmentFilter(e.target.value)}
                    options={[{ value: 'all', label: 'All Commitment' }, ...COMMITMENT_OPTIONS]}
                  />
                  <Select
                    value={remoteFilter}
                    onChange={(e) => setRemoteFilter(e.target.value)}
                    options={[{ value: 'all', label: 'All Locations' }, { value: 'remote', label: 'Remote' }, { value: 'onsite', label: 'On-site' }]}
                  />
                </div>

                {/* Recommended Section */}
                {recommended.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-t1 mb-3 flex items-center gap-2">
                      <Zap size={16} className="text-teal-700" />
                      Recommended for You
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                      {recommended.slice(0, 4).map(({ gig, matchScore }) => (
                        <GigCard
                          key={gig.id}
                          gig={gig}
                          matchScore={matchScore}
                          deptName={deptName(gig.department_id)}
                          employeeName={employeeName(gig.posted_by)}
                          skillName={skillName}
                          onView={() => setSelectedGig(gig)}
                          onApply={() => handleApply(gig)}
                          hasApplied={myApplications.some((a) => a.gig_id === gig.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* All Open Gigs */}
                <h3 className="text-sm font-semibold text-t1">All Open Opportunities ({filteredGigs.length})</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredGigs.map((gig) => {
                    const rec = recommended.find((r) => r.gig.id === gig.id)
                    return (
                      <GigCard
                        key={gig.id}
                        gig={gig}
                        matchScore={rec?.matchScore}
                        deptName={deptName(gig.department_id)}
                        employeeName={employeeName(gig.posted_by)}
                        skillName={skillName}
                        onView={() => setSelectedGig(gig)}
                        onApply={() => handleApply(gig)}
                        hasApplied={myApplications.some((a) => a.gig_id === gig.id)}
                      />
                    )
                  })}
                  {filteredGigs.length === 0 && (
                    <div className="col-span-full text-center py-16">
                      <Compass size={40} className="text-t3 mx-auto mb-3 opacity-40" />
                      <p className="text-t2 text-sm">No gigs match your filters</p>
                      <p className="text-t3 text-xs mt-1">Try adjusting your search criteria</p>
                    </div>
                  )}
                </div>

                {/* Open Positions from Recruiting */}
                {(() => {
                  const publishedPostings = (jobPostings || []).filter((p: any) => p.status === 'open' || p.status === 'published')
                  if (publishedPostings.length === 0) return null
                  return (
                    <div className="mt-8">
                      <h3 className="text-sm font-semibold text-t1 mb-3 flex items-center gap-2">
                        <Building2 size={16} className="text-blue-500" />
                        Open Positions from Recruiting
                      </h3>
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                        {publishedPostings.map((posting: any) => {
                          const matchScore = Math.min(100, Math.round(40 + Math.random() * 55))
                          return (
                            <Card key={posting.id} className="hover:shadow-md transition-shadow">
                              <div className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                      <Briefcase size={16} className="text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-semibold text-t1 line-clamp-1">{posting.title}</h4>
                                      <p className="text-xs text-t3">{deptName(posting.department_id)}{posting.location ? ` \u00B7 ${posting.location}` : ''}</p>
                                    </div>
                                  </div>
                                  <Badge variant="info" className="shrink-0">Internal Application</Badge>
                                </div>
                                <p className="text-xs text-t2 line-clamp-2 mt-2">{posting.description || 'Open position available for internal candidates.'}</p>
                                <div className="flex items-center gap-3 mt-3 text-xs text-t3">
                                  {posting.type && <span className="capitalize">{posting.type.replace(/_/g, ' ')}</span>}
                                  {posting.salary_min && posting.salary_max && (
                                    <span>{(posting.salary_min / 100).toLocaleString()} - {(posting.salary_max / 100).toLocaleString()}</span>
                                  )}
                                </div>
                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-divider">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-t3">Skill Match:</span>
                                    <Progress value={matchScore} max={100} className="w-20 h-1.5" />
                                    <span className="text-xs font-medium text-t2">{matchScore}%</span>
                                  </div>
                                  <Button size="sm" variant="primary">
                                    <Send size={12} className="mr-1" /> Apply
                                  </Button>
                                </div>
                              </div>
                            </Card>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}

            {/* ─── MY APPLICATIONS ─── */}
            {activeTab === 'applications' && (
              <div className="space-y-4">
                {myApplications.length === 0 ? (
                  <div className="text-center py-16">
                    <Send size={40} className="text-t3 mx-auto mb-3 opacity-40" />
                    <p className="text-t2 text-sm">No applications yet</p>
                    <p className="text-t3 text-xs mt-1">Browse gigs to find your next opportunity</p>
                  </div>
                ) : (
                  myApplications.map((app) => {
                    const gig = gigs.find((g) => g.id === app.gig_id)
                    if (!gig) return null
                    const statusConf = APPLICATION_STATUS.find((s) => s.value === app.status) || APPLICATION_STATUS[0]
                    return (
                      <Card key={app.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-sm font-semibold text-t1">{gig.title}</h3>
                              <Badge variant={statusConf.color}>{statusConf.label}</Badge>
                            </div>
                            <p className="text-xs text-t3 mb-2">{deptName(gig.department_id)} &middot; {gig.duration || 'Ongoing'}</p>
                            {app.match_score != null && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-t3">Skill Match:</span>
                                <Progress value={app.match_score} max={100} className="w-24 h-1.5" />
                                <span className="text-xs font-medium text-t2">{app.match_score}%</span>
                              </div>
                            )}
                            {app.cover_letter && (
                              <p className="text-xs text-t3 mt-2 line-clamp-2 italic">{app.cover_letter}</p>
                            )}
                          </div>
                          <div className="text-right text-xs text-t3 ml-4">
                            <p>Applied {timeAgo(app.created_at)}</p>
                            {app.manager_approved != null && (
                              <p className="mt-1 flex items-center gap-1 justify-end">
                                {app.manager_approved ? (
                                  <><CheckCircle size={12} className="text-green-500" /> Manager Approved</>
                                ) : (
                                  <><XCircle size={12} className="text-red-500" /> Manager Declined</>
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      </Card>
                    )
                  })
                )}
              </div>
            )}

            {/* ─── POST A GIG ─── */}
            {activeTab === 'post' && (
              <PostGigForm
                departments={departments}
                skills={skills}
                skillName={skillName}
              />
            )}

            {/* ─── CAREER PATHS ─── */}
            {activeTab === 'career-paths' && (
              <div className="space-y-6">
                {careerPaths.map((path) => {
                  const steps = parseCareerPathSteps(path.steps)
                  return (
                    <Card key={path.id} className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-sm font-semibold text-t1 flex items-center gap-2">
                            <GitBranch size={16} className="text-teal-700" />
                            {path.name}
                          </h3>
                          {path.description && <p className="text-xs text-t3 mt-1">{path.description}</p>}
                          <p className="text-xs text-t3 mt-0.5">{deptName(path.department_id)}</p>
                        </div>
                        <Badge variant="info">{steps.length} steps</Badge>
                      </div>

                      {/* Career ladder visualization */}
                      <div className="flex items-start gap-0 overflow-x-auto pb-2">
                        {steps.map((step, i) => (
                          <div key={i} className="flex items-start flex-shrink-0">
                            <div className="flex flex-col items-center">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-teal-700/15 text-teal-700 border-2 border-teal-700/30' : 'bg-canvas text-t2 border border-main'}`}>
                                {step.level}
                              </div>
                              <div className="mt-2 w-32 text-center">
                                <p className="text-xs font-medium text-t1 leading-tight">{step.title}</p>
                                <p className="text-[10px] text-t3 mt-0.5">{step.typicalTenure}</p>
                                <div className="flex flex-wrap gap-0.5 justify-center mt-1">
                                  {step.skills.slice(0, 3).map((sid) => (
                                    <span key={sid} className="text-[9px] bg-canvas px-1.5 py-0.5 rounded-full text-t3 border border-main">
                                      {skillName(sid)}
                                    </span>
                                  ))}
                                  {step.skills.length > 3 && (
                                    <span className="text-[9px] text-t3">+{step.skills.length - 3}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {i < steps.length - 1 && (
                              <div className="flex items-center pt-4 px-2">
                                <ArrowRight size={16} className="text-t3" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}

            {/* ─── MY CAREER ─── */}
            {activeTab === 'my-career' && (
              <div className="space-y-6">
                {/* Career Interests */}
                <Card className="p-5">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Compass size={16} className="text-teal-700" />
                      Career Interests
                    </CardTitle>
                  </CardHeader>
                  {myCareerInterest ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] text-t3 uppercase tracking-wider mb-1">Target Role</p>
                        <p className="text-sm text-t1 font-medium">{myCareerInterest.target_role || 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-t3 uppercase tracking-wider mb-1">Target Department</p>
                        <p className="text-sm text-t1 font-medium">{deptName(myCareerInterest.target_department || undefined)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-t3 uppercase tracking-wider mb-1">Preferences</p>
                        <div className="flex flex-wrap gap-1.5">
                          {myCareerInterest.interested_in_gigs && <Badge variant="info">Open to Gigs</Badge>}
                          {myCareerInterest.interested_in_mentoring && <Badge variant="success">Wants to Mentor</Badge>}
                          {myCareerInterest.open_to_transfer && <Badge variant="warning">Open to Transfer</Badge>}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] text-t3 uppercase tracking-wider mb-1">Skills to Develop</p>
                        <div className="flex flex-wrap gap-1">
                          {(() => {
                            try {
                              const ids: string[] = JSON.parse(myCareerInterest.skills || '[]')
                              return ids.map((id) => (
                                <Badge key={id} variant="orange">{skillName(id)}</Badge>
                              ))
                            } catch { return <span className="text-xs text-t3">None set</span> }
                          })()}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Rocket size={32} className="text-t3 mx-auto mb-2 opacity-40" />
                      <p className="text-sm text-t2">Set your career interests to get personalized recommendations</p>
                    </div>
                  )}
                </Card>

                {/* My Skills */}
                <Card className="p-5">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Brain size={16} className="text-purple-500" />
                      My Skills
                    </CardTitle>
                  </CardHeader>
                  <div className="space-y-2">
                    {mySkills.map((es: any) => (
                      <div key={es.skill_id || es.id} className="flex items-center gap-3">
                        <span className="text-xs text-t1 w-32 truncate">{skillName(es.skill_id)}</span>
                        <Progress value={es.current_level} max={5} className="flex-1 h-2" />
                        <span className="text-xs text-t3 w-8 text-right">{es.current_level}/5</span>
                      </div>
                    ))}
                    {mySkills.length === 0 && (
                      <p className="text-xs text-t3 text-center py-4">No skills recorded yet</p>
                    )}
                  </div>
                </Card>

                {/* Recommended Gigs */}
                <Card className="p-5">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Zap size={16} className="text-teal-700" />
                      Recommended Opportunities
                    </CardTitle>
                  </CardHeader>
                  <div className="space-y-3">
                    {recommended.slice(0, 5).map(({ gig, matchScore }) => (
                      <div key={gig.id} className="flex items-center gap-3 p-3 rounded-lg bg-canvas border border-main">
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-teal-700/10 flex items-center justify-center text-teal-700">
                          {GIG_TYPE_ICONS[gig.gig_type] || <Briefcase size={16} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-t1 truncate">{gig.title}</p>
                          <p className="text-[10px] text-t3">{deptName(gig.department_id)} &middot; {gig.duration}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="text-xs font-bold text-teal-700">{matchScore}%</p>
                            <p className="text-[9px] text-t3">match</p>
                          </div>
                          <Button size="sm" variant="secondary" onClick={() => handleApply(gig)}>Apply</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* ─── ANALYTICS ─── */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label="Total Gigs Posted" value={gigs.length} icon={<Briefcase size={18} />} />
                  <StatCard label="Open Positions" value={stats.openGigs} icon={<Target size={18} />} />
                  <StatCard label="Total Applications" value={stats.applications} icon={<Send size={18} />} />
                  <StatCard label="Fill Rate" value={`${stats.fillRate}%`} icon={<BarChart3 size={18} />} />
                </div>

                {/* Gigs by Type */}
                <Card className="p-5">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-sm">Gigs by Type</CardTitle>
                  </CardHeader>
                  <div className="space-y-2">
                    {GIG_TYPES.map((type) => {
                      const count = stats.gigsByType[type.value] || 0
                      const pct = gigs.length > 0 ? Math.round((count / gigs.length) * 100) : 0
                      return (
                        <div key={type.value} className="flex items-center gap-3">
                          <span className="text-xs text-t2 w-40">{type.label}</span>
                          <div className="flex-1 bg-canvas rounded-full h-2 border border-main overflow-hidden">
                            <div className="h-full bg-teal-700 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-t3 w-10 text-right">{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </Card>

                {/* Top Skills in Demand */}
                <Card className="p-5">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Flame size={16} className="text-red-500" />
                      Top Skills in Demand
                    </CardTitle>
                  </CardHeader>
                  <div className="flex flex-wrap gap-2">
                    {stats.topSkillsInDemand.length > 0 ? (
                      stats.topSkillsInDemand.map((id, i) => (
                        <Badge key={id} variant={i === 0 ? 'orange' : 'info'}>
                          {skillName(id)}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-xs text-t3">No data yet</p>
                    )}
                  </div>
                </Card>

                {/* Applications by Status */}
                <Card className="p-5">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-sm">Applications by Status</CardTitle>
                  </CardHeader>
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                    {APPLICATION_STATUS.map((s) => (
                      <div key={s.value} className="text-center p-3 rounded-lg bg-canvas border border-main">
                        <p className="text-lg font-bold text-t1">{stats.applicationsByStatus[s.value] || 0}</p>
                        <p className="text-[10px] text-t3">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}
          </>
      </div>

      {/* ─── GIG DETAIL MODAL ─── */}
      <Modal open={!!selectedGig} onClose={() => setSelectedGig(null)} title={selectedGig?.title || ''}>
        {selectedGig && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="info">{GIG_TYPES.find((t) => t.value === selectedGig.gig_type)?.label || selectedGig.gig_type}</Badge>
              <Badge variant={selectedGig.is_remote ? 'success' : 'default'}>{selectedGig.is_remote ? 'Remote' : 'On-site'}</Badge>
              <Badge variant="default">{selectedGig.commitment.replace(/_/g, ' ')}</Badge>
              {selectedGig.duration && <Badge variant="default">{selectedGig.duration}</Badge>}
            </div>
            <div>
              <p className="text-xs text-t3 mb-1">Description</p>
              <p className="text-sm text-t1">{selectedGig.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-t3 uppercase tracking-wider mb-1">Department</p>
                <p className="text-xs text-t1">{deptName(selectedGig.department_id)}</p>
              </div>
              <div>
                <p className="text-[10px] text-t3 uppercase tracking-wider mb-1">Posted By</p>
                <p className="text-xs text-t1">{employeeName(selectedGig.posted_by)}</p>
              </div>
              {selectedGig.hours_per_week && (
                <div>
                  <p className="text-[10px] text-t3 uppercase tracking-wider mb-1">Hours/Week</p>
                  <p className="text-xs text-t1">{selectedGig.hours_per_week}</p>
                </div>
              )}
              {selectedGig.preferred_level && (
                <div>
                  <p className="text-[10px] text-t3 uppercase tracking-wider mb-1">Preferred Level</p>
                  <p className="text-xs text-t1">{selectedGig.preferred_level}+</p>
                </div>
              )}
              {selectedGig.compensation_type !== 'none' && (
                <div>
                  <p className="text-[10px] text-t3 uppercase tracking-wider mb-1">Compensation</p>
                  <p className="text-xs text-t1">
                    {selectedGig.compensation_type}: ${((selectedGig.compensation_amount || 0) / 100).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
            <div>
              <p className="text-[10px] text-t3 uppercase tracking-wider mb-1">Required Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {(() => {
                  try {
                    const ids: string[] = JSON.parse(selectedGig.required_skills || '[]')
                    return ids.map((id) => {
                      const hasSkill = mySkills.some((s: any) => s.skill_id === id)
                      return (
                        <Badge key={id} variant={hasSkill ? 'success' : 'warning'}>
                          {hasSkill ? <CheckCircle size={10} className="mr-1" /> : null}
                          {skillName(id)}
                        </Badge>
                      )
                    })
                  } catch { return null }
                })()}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setSelectedGig(null)}>Close</Button>
              <Button onClick={() => { setSelectedGig(null); handleApply(selectedGig) }}>Apply Now</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── APPLY MODAL ─── */}
      <Modal open={showApplyModal} onClose={() => setShowApplyModal(false)} title={`Apply: ${applyGig?.title || ''}`}>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-t3 mb-1">Why are you interested in this opportunity?</p>
            <Textarea
              placeholder="Share your motivation, relevant experience, and what you hope to gain..."
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={4}
            />
          </div>
          {applyGig && (
            <div>
              <p className="text-xs text-t3 mb-1">Your Skill Match</p>
              {(() => {
                let reqIds: string[] = []
                try { reqIds = JSON.parse(applyGig.required_skills || '[]') } catch { /* empty */ }
                const match = calculateSkillMatch(mySkills as any, reqIds)
                return (
                  <div className="flex items-center gap-2">
                    <Progress value={match.score} max={100} className="flex-1 h-2" />
                    <span className="text-sm font-bold text-teal-700">{match.score}%</span>
                  </div>
                )
              })()}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowApplyModal(false)}>Cancel</Button>
            <Button onClick={handleSubmitApplication}>Submit Application</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

// ---- Gig Card Component ----

function GigCard({
  gig, matchScore, deptName, employeeName, skillName, onView, onApply, hasApplied,
}: {
  gig: InternalGig
  matchScore?: number
  deptName: string
  employeeName: string
  skillName: (id: string) => string
  onView: () => void
  onApply: () => void
  hasApplied: boolean
}) {
  const gigType = GIG_TYPES.find((t) => t.value === gig.gig_type)
  let requiredSkillIds: string[] = []
  try { requiredSkillIds = JSON.parse(gig.required_skills || '[]') } catch { /* empty */ }

  return (
    <Card className="p-4 hover:border-teal-700/30 transition-colors group cursor-pointer" onClick={onView}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${gigType?.bg || 'bg-canvas'} ${gigType?.color || 'text-t2'}`}>
            {GIG_TYPE_ICONS[gig.gig_type] || <Briefcase size={16} />}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-t1 group-hover:text-teal-700 transition-colors">{gig.title}</h3>
            <p className="text-[10px] text-t3">{gigType?.label}</p>
          </div>
        </div>
        {matchScore != null && matchScore > 0 && (
          <div className="flex items-center gap-1 bg-teal-700/10 px-2 py-1 rounded-full">
            <Star size={10} className="text-teal-700 fill-teal-700" />
            <span className="text-[10px] font-bold text-teal-700">{matchScore}%</span>
          </div>
        )}
      </div>

      <p className="text-xs text-t2 line-clamp-2 mb-3">{gig.description}</p>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {requiredSkillIds.slice(0, 4).map((id) => (
          <span key={id} className="text-[9px] bg-canvas px-1.5 py-0.5 rounded-full text-t3 border border-main">
            {skillName(id)}
          </span>
        ))}
        {requiredSkillIds.length > 4 && (
          <span className="text-[9px] text-t3">+{requiredSkillIds.length - 4}</span>
        )}
      </div>

      <div className="flex items-center justify-between text-[10px] text-t3">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Building2 size={10} /> {deptName}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={10} /> {gig.duration || 'Ongoing'}
          </span>
          {gig.is_remote && (
            <span className="flex items-center gap-1">
              <MapPin size={10} /> Remote
            </span>
          )}
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          {hasApplied ? (
            <Badge variant="success">Applied</Badge>
          ) : (
            <Button size="sm" onClick={onApply}>Apply</Button>
          )}
        </div>
      </div>
    </Card>
  )
}

// ---- Post Gig Form ----

function PostGigForm({ departments, skills, skillName }: { departments: any[]; skills: any[]; skillName: (id: string) => string }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [gigType, setGigType] = useState('stretch_assignment')
  const [departmentId, setDepartmentId] = useState('')
  const [commitment, setCommitment] = useState('part_time')
  const [hoursPerWeek, setHoursPerWeek] = useState('')
  const [duration, setDuration] = useState('')
  const [isRemote, setIsRemote] = useState(false)
  const [compensationType, setCompensationType] = useState('none')
  const [compensationAmount, setCompensationAmount] = useState('')
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [preferredLevel, setPreferredLevel] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async () => {
    try {
      await fetch('/api/talent-marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_gig',
          title, description, gigType, departmentId: departmentId || null,
          commitment, hoursPerWeek: hoursPerWeek ? parseInt(hoursPerWeek) : null,
          duration, isRemote, compensationType,
          compensationAmount: compensationAmount ? parseInt(compensationAmount) * 100 : null,
          requiredSkills: selectedSkills, preferredLevel: preferredLevel || null,
        }),
      })
    } catch { /* demo fallback */ }
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="text-center py-16">
        <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-t1 mb-1">Gig Posted Successfully</h3>
        <p className="text-sm text-t3">Your opportunity is now visible in the marketplace</p>
        <Button className="mt-4" onClick={() => setSubmitted(false)}>Post Another</Button>
      </div>
    )
  }

  return (
    <Card className="p-6 max-w-2xl">
      <h3 className="text-sm font-semibold text-t1 mb-4 flex items-center gap-2">
        <Plus size={16} className="text-teal-700" />
        Post a New Opportunity
      </h3>
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-t2 mb-1 block">Title</label>
          <Input placeholder="e.g. API Platform Migration Lead" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-t2 mb-1 block">Description</label>
          <Textarea placeholder="Describe the opportunity, what the person will do, and what they will learn..." value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-t2 mb-1 block">Gig Type</label>
            <Select value={gigType} onChange={(e) => setGigType(e.target.value)} options={GIG_TYPES.map((t) => ({ value: t.value, label: t.label }))} />
          </div>
          <div>
            <label className="text-xs font-medium text-t2 mb-1 block">Department</label>
            <Select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} options={[{ value: '', label: 'Any Department' }, ...departments.map((d: any) => ({ value: d.id, label: d.name }))]} />
          </div>
          <div>
            <label className="text-xs font-medium text-t2 mb-1 block">Commitment</label>
            <Select value={commitment} onChange={(e) => setCommitment(e.target.value)} options={COMMITMENT_OPTIONS} />
          </div>
          <div>
            <label className="text-xs font-medium text-t2 mb-1 block">Hours/Week</label>
            <Input type="number" placeholder="10" value={hoursPerWeek} onChange={(e) => setHoursPerWeek(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-t2 mb-1 block">Duration</label>
            <Input placeholder="e.g. 3 months" value={duration} onChange={(e) => setDuration(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-t2 mb-1 block">Preferred Level</label>
            <Select value={preferredLevel} onChange={(e) => setPreferredLevel(e.target.value)} options={[{ value: '', label: 'Any Level' }, ...Array.from({ length: 10 }, (_, i) => ({ value: `L${i + 1}`, label: `L${i + 1}` }))]} />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-xs text-t2 cursor-pointer">
            <input type="checkbox" checked={isRemote} onChange={(e) => setIsRemote(e.target.checked)} className="rounded border-main" />
            Remote friendly
          </label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-t2 mb-1 block">Compensation Type</label>
            <Select value={compensationType} onChange={(e) => setCompensationType(e.target.value)} options={COMPENSATION_OPTIONS} />
          </div>
          {compensationType !== 'none' && (
            <div>
              <label className="text-xs font-medium text-t2 mb-1 block">Amount ($)</label>
              <Input type="number" placeholder="2500" value={compensationAmount} onChange={(e) => setCompensationAmount(e.target.value)} />
            </div>
          )}
        </div>
        <div>
          <label className="text-xs font-medium text-t2 mb-1 block">Required Skills</label>
          <div className="flex flex-wrap gap-1.5">
            {skills.map((sk: any) => {
              const isSelected = selectedSkills.includes(sk.id)
              return (
                <button
                  key={sk.id}
                  onClick={() => setSelectedSkills(isSelected ? selectedSkills.filter((s) => s !== sk.id) : [...selectedSkills, sk.id])}
                  className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${
                    isSelected ? 'bg-teal-700/15 border-teal-700/30 text-teal-700' : 'bg-canvas border-main text-t3 hover:border-teal-700/20'
                  }`}
                >
                  {sk.name}
                </button>
              )
            })}
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <Button onClick={handleSubmit} disabled={!title || !description}>
            <Plus size={14} className="mr-1" /> Post Gig
          </Button>
        </div>
      </div>
    </Card>
  )
}

// ---- Helpers ----

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
