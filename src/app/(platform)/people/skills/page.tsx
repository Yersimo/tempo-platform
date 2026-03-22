'use client'

import { useState, useMemo, useEffect } from 'react'
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
  SKILL_CATEGORIES,
  PROFICIENCY_LEVELS,
  analyzeSkillsGap,
  type SkillGap,
} from '@/lib/services/succession-engine'
import {
  Lightbulb, Code, Users, BookOpen, Plus, Search, Target,
  BarChart3, Zap, Award, TrendingUp, Layers, ArrowRight,
  Brain, Briefcase, Heart, Star, Edit, ChevronRight,
  GraduationCap, Puzzle, Flame,
} from 'lucide-react'

// ---- Demo Skills Data ----
const DEMO_SKILLS = [
  { id: 'sk-1', org_id: 'org-1', name: 'TypeScript', category: 'technical', description: 'Modern typed JavaScript', is_core: true },
  { id: 'sk-2', org_id: 'org-1', name: 'React', category: 'technical', description: 'Frontend UI library', is_core: true },
  { id: 'sk-3', org_id: 'org-1', name: 'System Design', category: 'technical', description: 'Architecture and scalability', is_core: false },
  { id: 'sk-4', org_id: 'org-1', name: 'Team Leadership', category: 'leadership', description: 'Leading and motivating teams', is_core: true },
  { id: 'sk-5', org_id: 'org-1', name: 'Strategic Thinking', category: 'leadership', description: 'Long-term vision and planning', is_core: false },
  { id: 'sk-6', org_id: 'org-1', name: 'Stakeholder Management', category: 'leadership', description: 'Managing relationships across the org', is_core: false },
  { id: 'sk-7', org_id: 'org-1', name: 'Project Management', category: 'functional', description: 'Planning, executing, and closing projects', is_core: true },
  { id: 'sk-8', org_id: 'org-1', name: 'Data Analysis', category: 'functional', description: 'Interpreting data to inform decisions', is_core: false },
  { id: 'sk-9', org_id: 'org-1', name: 'Communication', category: 'behavioral', description: 'Clear and effective communication', is_core: true },
  { id: 'sk-10', org_id: 'org-1', name: 'Problem Solving', category: 'behavioral', description: 'Analytical approach to challenges', is_core: true },
  { id: 'sk-11', org_id: 'org-1', name: 'Python', category: 'technical', description: 'General-purpose programming', is_core: false },
  { id: 'sk-12', org_id: 'org-1', name: 'Cloud Architecture (AWS)', category: 'technical', description: 'AWS cloud services and infrastructure', is_core: false },
  { id: 'sk-13', org_id: 'org-1', name: 'Change Management', category: 'leadership', description: 'Leading organizational change', is_core: false },
  { id: 'sk-14', org_id: 'org-1', name: 'Coaching & Mentoring', category: 'leadership', description: 'Developing others through guidance', is_core: false },
  { id: 'sk-15', org_id: 'org-1', name: 'Adaptability', category: 'behavioral', description: 'Flexibility in changing environments', is_core: false },
]

const DEMO_EMPLOYEE_SKILLS = [
  { id: 'es-1', org_id: 'org-1', employee_id: 'emp-1', skill_id: 'sk-1', current_level: 5, target_level: 5, endorsements: 12 },
  { id: 'es-2', org_id: 'org-1', employee_id: 'emp-1', skill_id: 'sk-2', current_level: 5, target_level: 5, endorsements: 10 },
  { id: 'es-3', org_id: 'org-1', employee_id: 'emp-1', skill_id: 'sk-3', current_level: 4, target_level: 5, endorsements: 8 },
  { id: 'es-4', org_id: 'org-1', employee_id: 'emp-1', skill_id: 'sk-4', current_level: 4, target_level: 5, endorsements: 6 },
  { id: 'es-5', org_id: 'org-1', employee_id: 'emp-1', skill_id: 'sk-9', current_level: 4, target_level: 5, endorsements: 5 },
  { id: 'es-6', org_id: 'org-1', employee_id: 'emp-2', skill_id: 'sk-1', current_level: 4, target_level: 5, endorsements: 7 },
  { id: 'es-7', org_id: 'org-1', employee_id: 'emp-2', skill_id: 'sk-3', current_level: 3, target_level: 4, endorsements: 3 },
  { id: 'es-8', org_id: 'org-1', employee_id: 'emp-2', skill_id: 'sk-4', current_level: 3, target_level: 5, endorsements: 4 },
  { id: 'es-9', org_id: 'org-1', employee_id: 'emp-2', skill_id: 'sk-5', current_level: 2, target_level: 4, endorsements: 1 },
  { id: 'es-10', org_id: 'org-1', employee_id: 'emp-3', skill_id: 'sk-1', current_level: 4, target_level: 5, endorsements: 6 },
  { id: 'es-11', org_id: 'org-1', employee_id: 'emp-3', skill_id: 'sk-7', current_level: 4, target_level: 5, endorsements: 5 },
  { id: 'es-12', org_id: 'org-1', employee_id: 'emp-3', skill_id: 'sk-10', current_level: 5, target_level: 5, endorsements: 9 },
  { id: 'es-13', org_id: 'org-1', employee_id: 'emp-4', skill_id: 'sk-11', current_level: 5, target_level: 5, endorsements: 11 },
  { id: 'es-14', org_id: 'org-1', employee_id: 'emp-4', skill_id: 'sk-8', current_level: 5, target_level: 5, endorsements: 8 },
  { id: 'es-15', org_id: 'org-1', employee_id: 'emp-4', skill_id: 'sk-12', current_level: 3, target_level: 5, endorsements: 2 },
  { id: 'es-16', org_id: 'org-1', employee_id: 'emp-5', skill_id: 'sk-2', current_level: 3, target_level: 4, endorsements: 4 },
  { id: 'es-17', org_id: 'org-1', employee_id: 'emp-5', skill_id: 'sk-9', current_level: 5, target_level: 5, endorsements: 7 },
  { id: 'es-18', org_id: 'org-1', employee_id: 'emp-5', skill_id: 'sk-6', current_level: 4, target_level: 5, endorsements: 5 },
  { id: 'es-19', org_id: 'org-1', employee_id: 'emp-6', skill_id: 'sk-1', current_level: 3, target_level: 4, endorsements: 3 },
  { id: 'es-20', org_id: 'org-1', employee_id: 'emp-6', skill_id: 'sk-7', current_level: 3, target_level: 4, endorsements: 2 },
]

const DEMO_ROLE_REQUIREMENTS = [
  { id: 'rr-1', org_id: 'org-1', job_title: 'Senior Engineer', level: 'L5', skill_id: 'sk-1', required_level: 4, importance: 'required' },
  { id: 'rr-2', org_id: 'org-1', job_title: 'Senior Engineer', level: 'L5', skill_id: 'sk-2', required_level: 4, importance: 'required' },
  { id: 'rr-3', org_id: 'org-1', job_title: 'Senior Engineer', level: 'L5', skill_id: 'sk-3', required_level: 3, importance: 'preferred' },
  { id: 'rr-4', org_id: 'org-1', job_title: 'Senior Engineer', level: 'L5', skill_id: 'sk-9', required_level: 3, importance: 'required' },
  { id: 'rr-5', org_id: 'org-1', job_title: 'Engineering Manager', level: 'L6', skill_id: 'sk-1', required_level: 4, importance: 'required' },
  { id: 'rr-6', org_id: 'org-1', job_title: 'Engineering Manager', level: 'L6', skill_id: 'sk-4', required_level: 4, importance: 'required' },
  { id: 'rr-7', org_id: 'org-1', job_title: 'Engineering Manager', level: 'L6', skill_id: 'sk-5', required_level: 3, importance: 'preferred' },
  { id: 'rr-8', org_id: 'org-1', job_title: 'Engineering Manager', level: 'L6', skill_id: 'sk-7', required_level: 4, importance: 'required' },
  { id: 'rr-9', org_id: 'org-1', job_title: 'Engineering Manager', level: 'L6', skill_id: 'sk-9', required_level: 4, importance: 'required' },
]

const DEMO_DEVELOPMENT_PLANS = [
  { id: 'dp-1', org_id: 'org-1', employee_id: 'emp-2', title: 'Path to Engineering Manager', status: 'active', target_date: '2026-12-31', manager_notes: 'Strong candidate for EM role' },
  { id: 'dp-2', org_id: 'org-1', employee_id: 'emp-4', title: 'Cloud Architecture Mastery', status: 'active', target_date: '2026-09-30', manager_notes: 'Needs deeper AWS expertise' },
  { id: 'dp-3', org_id: 'org-1', employee_id: 'emp-6', title: 'Senior Engineer Readiness', status: 'active', target_date: '2026-06-30', manager_notes: 'On track for promotion' },
]

const DEMO_DEV_ITEMS = [
  { id: 'di-1', plan_id: 'dp-1', skill_id: 'sk-4', type: 'mentoring', title: 'Leadership mentoring with VP Eng', status: 'in_progress', target_date: '2026-06-30' },
  { id: 'di-2', plan_id: 'dp-1', skill_id: 'sk-5', type: 'course', title: 'Strategic Leadership Course', status: 'not_started', target_date: '2026-09-30' },
  { id: 'di-3', plan_id: 'dp-1', skill_id: 'sk-7', type: 'stretch_assignment', title: 'Lead cross-team project', status: 'in_progress', target_date: '2026-08-30' },
  { id: 'di-4', plan_id: 'dp-2', skill_id: 'sk-12', type: 'certification', title: 'AWS Solutions Architect Professional', status: 'in_progress', target_date: '2026-06-30' },
  { id: 'di-5', plan_id: 'dp-2', skill_id: 'sk-12', type: 'project', title: 'Design new microservices platform', status: 'not_started', target_date: '2026-09-30' },
  { id: 'di-6', plan_id: 'dp-3', skill_id: 'sk-1', type: 'course', title: 'Advanced TypeScript Patterns', status: 'completed', target_date: '2026-03-31' },
  { id: 'di-7', plan_id: 'dp-3', skill_id: 'sk-7', type: 'coaching', title: 'Weekly coaching sessions', status: 'in_progress', target_date: '2026-06-30' },
]

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  technical: <Code size={14} />,
  leadership: <Users size={14} />,
  functional: <Briefcase size={14} />,
  behavioral: <Heart size={14} />,
}

const CATEGORY_COLORS: Record<string, string> = {
  technical: 'bg-blue-50 text-blue-700 border-blue-200',
  leadership: 'bg-purple-50 text-purple-700 border-purple-200',
  functional: 'bg-green-50 text-green-700 border-green-200',
  behavioral: 'bg-amber-50 text-amber-700 border-amber-200',
}

const ITEM_TYPE_DISPLAY: Record<string, { label: string; icon: React.ReactNode }> = {
  course: { label: 'Course', icon: <GraduationCap size={14} /> },
  mentoring: { label: 'Mentoring', icon: <Users size={14} /> },
  stretch_assignment: { label: 'Stretch Assignment', icon: <Target size={14} /> },
  coaching: { label: 'Coaching', icon: <Heart size={14} /> },
  certification: { label: 'Certification', icon: <Award size={14} /> },
  project: { label: 'Project', icon: <Puzzle size={14} /> },
}

export default function SkillsDevelopmentPage() {
  const store = useTempo()
  const { employees, departments, ensureModulesLoaded, isLoading, courses, addEnrollment, addToast } = store

  const [activeTab, setActiveTab] = useState('library')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showNewSkillModal, setShowNewSkillModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null)
  const [showNewDevPlanModal, setShowNewDevPlanModal] = useState(false)

  // Form state
  const [newSkill, setNewSkill] = useState({ name: '', category: 'technical', description: '', isCore: false })

  useEffect(() => {
    ensureModulesLoaded?.(['employees', 'departments', 'skills', 'employeeSkills', 'roleSkillRequirements', 'developmentPlans', 'developmentPlanItems'])
  }, [ensureModulesLoaded])

  // Use store data with demo fallback
  const skills = (store.skills?.length > 0 ? store.skills : DEMO_SKILLS) as any[]
  const employeeSkills = (store.employeeSkills?.length > 0 ? store.employeeSkills : DEMO_EMPLOYEE_SKILLS) as any[]
  const roleRequirements = (store.roleSkillRequirements?.length > 0 ? store.roleSkillRequirements : DEMO_ROLE_REQUIREMENTS) as any[]
  const devPlans = (store.developmentPlans?.length > 0 ? store.developmentPlans : DEMO_DEVELOPMENT_PLANS) as any[]
  const devItems = (store.developmentPlanItems?.length > 0 ? store.developmentPlanItems : DEMO_DEV_ITEMS) as any[]

  const getEmployeeName = (id: string) => {
    const emp = employees.find((e: any) => e.id === id)
    return emp?.profile?.full_name || (emp as any)?.full_name || `Employee ${id.slice(-4)}`
  }

  const getSkillName = (id: string) => skills.find((s: any) => s.id === id)?.name || 'Unknown'

  // Filter skills
  const filteredSkills = useMemo(() => {
    return skills.filter(s => {
      if (categoryFilter && s.category !== categoryFilter) return false
      if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
  }, [skills, categoryFilter, searchQuery])

  // Skills by category for library view
  const skillsByCategory = useMemo(() => {
    const grouped: Record<string, any[]> = {}
    filteredSkills.forEach(s => {
      if (!grouped[s.category]) grouped[s.category] = []
      grouped[s.category].push(s)
    })
    return grouped
  }, [filteredSkills])

  // Team heatmap data
  const heatmapData = useMemo(() => {
    const coreSkills = skills.filter(s => s.is_core)
    const empIds = [...new Set(employeeSkills.map(es => es.employee_id))]
    return {
      skills: coreSkills,
      employees: empIds.slice(0, 10),
      getLevel: (empId: string, skillId: string) => {
        const es = employeeSkills.find(e => e.employee_id === empId && e.skill_id === skillId)
        return es?.current_level || 0
      },
    }
  }, [skills, employeeSkills])

  // Selected employee skills for profile view
  const selectedEmpSkills = useMemo(() => {
    if (!selectedEmployee) return []
    return employeeSkills.filter(es => es.employee_id === selectedEmployee)
  }, [selectedEmployee, employeeSkills])

  // Skills gap for selected employee
  const selectedEmpGaps = useMemo(() => {
    if (!selectedEmployee) return []
    const emp = employees.find((e: any) => e.id === selectedEmployee)
    const jobTitle = emp?.job_title
    if (!jobTitle) return []
    const reqs = roleRequirements.filter((r: any) => r.job_title === jobTitle)
    const lookup: Record<string, string> = {}
    skills.forEach((s: any) => { lookup[s.id] = s.name })
    return analyzeSkillsGap(
      selectedEmpSkills.map(es => ({ skill_id: es.skill_id, current_level: es.current_level })),
      reqs.map((r: any) => ({ skill_id: r.skill_id, required_level: r.required_level, importance: r.importance })),
      lookup
    )
  }, [selectedEmployee, selectedEmpSkills, employees, roleRequirements, skills])

  // Stats
  const totalSkills = skills.length
  const coreSkillCount = skills.filter(s => s.is_core).length
  const avgProficiency = employeeSkills.length > 0
    ? Math.round(employeeSkills.reduce((sum: number, es: any) => sum + es.current_level, 0) / employeeSkills.length * 10) / 10
    : 0
  const activeDevPlans = devPlans.filter((dp: any) => dp.status === 'active').length

  if (isLoading) return <PageSkeleton />

  const tabs = [
    { id: 'library', label: 'Skills Library', count: totalSkills },
    { id: 'profiles', label: 'Employee Skills' },
    { id: 'gaps', label: 'Gap Analysis' },
    { id: 'heatmap', label: 'Team Heatmap' },
    { id: 'development', label: 'Development Plans', count: activeDevPlans },
    { id: 'requirements', label: 'Role Requirements' },
  ]

  return (
    <>
      <Header title="Skills & Development" subtitle="Manage skills framework, assess competencies, and drive employee growth" />
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Skills" value={totalSkills} icon={<Lightbulb size={20} />} change={`${coreSkillCount} core competencies`} changeType="neutral" />
          <StatCard label="Avg Proficiency" value={`${avgProficiency}/5`} icon={<BarChart3 size={20} />} change={`Across ${employeeSkills.length} assessments`} changeType="neutral" />
          <StatCard label="Active Dev Plans" value={activeDevPlans} icon={<Target size={20} />} change={`${devItems.filter((i: any) => i.status === 'completed').length} items completed`} changeType="positive" />
          <StatCard label="Skill Categories" value={SKILL_CATEGORIES.length} icon={<Layers size={20} />} change="Technical, Leadership, Functional, Behavioral" changeType="neutral" />
        </div>

        <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} maxVisible={6} />

        {/* Skills Library Tab */}
        {activeTab === 'library' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <Input placeholder="Search skills..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} icon={<Search size={16} />} />
              </div>
              <Select value={categoryFilter} onChange={(e: any) => setCategoryFilter(e.target.value)} options={[{ value: '', label: 'All Categories' }, ...SKILL_CATEGORIES]} />
              <Button onClick={() => setShowNewSkillModal(true)}><Plus size={16} className="mr-1" /> Add Skill</Button>
            </div>

            {Object.entries(skillsByCategory).map(([category, catSkills]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {CATEGORY_ICONS[category]}
                    {SKILL_CATEGORIES.find(c => c.value === category)?.label || category} Skills
                    <Badge variant="info">{catSkills.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <div className="px-6 pb-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {catSkills.map((skill: any) => {
                      const assessments = employeeSkills.filter(es => es.skill_id === skill.id)
                      const avgLevel = assessments.length > 0
                        ? Math.round(assessments.reduce((sum: number, es: any) => sum + es.current_level, 0) / assessments.length * 10) / 10
                        : 0
                      return (
                        <div key={skill.id} className="p-3 rounded-xl border border-border hover:border-tempo-200 transition-colors">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-t1">{skill.name}</p>
                            {skill.is_core && <Badge variant="orange">Core</Badge>}
                          </div>
                          {skill.description && <p className="text-xs text-t3 mb-2">{skill.description}</p>}
                          <div className="flex items-center gap-3 text-xs text-t3">
                            <span>{assessments.length} assessed</span>
                            {assessments.length > 0 && <span>Avg: {avgLevel}/5</span>}
                            <span>{employeeSkills.filter(es => es.skill_id === skill.id).reduce((sum: number, es: any) => sum + (es.endorsements || 0), 0)} endorsements</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Employee Skills Profiles Tab */}
        {activeTab === 'profiles' && (
          <div className="space-y-4">
            {selectedEmployee ? (
              <div className="space-y-4">
                <button onClick={() => setSelectedEmployee(null)} className="text-sm text-tempo-600 hover:text-tempo-700 flex items-center gap-1">
                  &larr; Back to Employees
                </button>

                {/* Employee Skill Profile */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Avatar name={getEmployeeName(selectedEmployee)} size="md" />
                      <div>
                        <CardTitle>{getEmployeeName(selectedEmployee)}</CardTitle>
                        <p className="text-xs text-t3">{selectedEmpSkills.length} skills assessed</p>
                      </div>
                    </div>
                  </CardHeader>
                  <div className="px-6 pb-6">
                    {/* Radar-like skill visualization */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Skills bars */}
                      <div className="space-y-3">
                        <p className="text-xs font-semibold text-t1 uppercase tracking-wide mb-2">Skill Proficiency</p>
                        {selectedEmpSkills.map((es: any) => {
                          const skill = skills.find((s: any) => s.id === es.skill_id)
                          return (
                            <div key={es.id} className="space-y-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-t1">{skill?.name || 'Unknown'}</span>
                                  {skill?.is_core && <Badge variant="orange" className="text-[0.5rem] px-1 py-0">Core</Badge>}
                                </div>
                                <span className="text-xs text-t3">{es.current_level}/{es.target_level || 5}</span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-2">
                                <div
                                  className="bg-tempo-500 h-2 rounded-full transition-all"
                                  style={{ width: `${(es.current_level / 5) * 100}%` }}
                                />
                                {es.target_level && (
                                  <div className="relative -mt-2">
                                    <div
                                      className="absolute top-0 w-0.5 h-2 bg-gray-400"
                                      style={{ left: `${(es.target_level / 5) * 100}%` }}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {/* Gap analysis for this employee */}
                      <div>
                        <p className="text-xs font-semibold text-t1 uppercase tracking-wide mb-2">Skills Gaps (vs Role Requirements)</p>
                        {selectedEmpGaps.length === 0 ? (
                          <p className="text-xs text-t3 py-4">No gaps found. Employee meets or exceeds all role requirements.</p>
                        ) : (
                          <div className="space-y-2">
                            {selectedEmpGaps.map((gap, idx) => (
                              <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-red-50/50 border border-red-100">
                                <div className="flex-1">
                                  <p className="text-xs font-medium text-t1">{gap.skillName}</p>
                                  <p className="text-[0.6rem] text-t3">
                                    Current: {gap.currentLevel}/5 &rarr; Required: {gap.requiredLevel}/5
                                  </p>
                                </div>
                                <Badge variant={gap.importance === 'required' ? 'error' : gap.importance === 'preferred' ? 'warning' : 'info'}>
                                  Gap: {gap.gap}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...new Set(employeeSkills.map(es => es.employee_id))].map(empId => {
                  const empSkillsList = employeeSkills.filter(es => es.employee_id === empId)
                  const avgLevel = empSkillsList.length > 0
                    ? Math.round(empSkillsList.reduce((sum: number, es: any) => sum + es.current_level, 0) / empSkillsList.length * 10) / 10
                    : 0
                  return (
                    <Card key={empId} className="cursor-pointer hover:border-tempo-200 transition-colors" onClick={() => setSelectedEmployee(empId)}>
                      <div className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar name={getEmployeeName(empId)} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-t1 truncate">{getEmployeeName(empId)}</p>
                            <p className="text-xs text-t3">{empSkillsList.length} skills</p>
                          </div>
                          <ChevronRight size={16} className="text-t3" />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-t3">Avg Level:</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                            <div className="bg-tempo-500 h-1.5 rounded-full" style={{ width: `${(avgLevel / 5) * 100}%` }} />
                          </div>
                          <span className="text-xs font-medium text-t2">{avgLevel}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {empSkillsList.slice(0, 4).map((es: any) => (
                            <span key={es.id} className="text-[0.55rem] px-1.5 py-0.5 bg-canvas rounded-full text-t3">{getSkillName(es.skill_id)}</span>
                          ))}
                          {empSkillsList.length > 4 && <span className="text-[0.55rem] px-1.5 py-0.5 text-t3">+{empSkillsList.length - 4}</span>}
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Gap Analysis Tab */}
        {activeTab === 'gaps' && (
          <div className="space-y-4">
            {/* Generate Learning Plan Button */}
            <div className="flex justify-end">
              <Button onClick={() => {
                const gaps = employeeSkills.filter((es: any) => {
                  const req = roleRequirements.find((r: any) => r.skill_id === es.skill_id)
                  return req && es.current_level < req.required_level
                })
                if (!gaps || gaps.length === 0) {
                  addToast?.('No skill gaps detected to generate a learning plan', 'info')
                  return
                }
                let courseCount = 0
                const processedSkills = new Set<string>()
                gaps.forEach((gap: any) => {
                  if (processedSkills.has(gap.skill_id)) return
                  processedSkills.add(gap.skill_id)
                  const skill = skills.find((s: any) => s.id === gap.skill_id)
                  const matchingCourse = courses?.find((c: any) =>
                    c.category?.toLowerCase().includes(skill?.category?.toLowerCase() || '')
                  )
                  if (matchingCourse && addEnrollment) {
                    addEnrollment({
                      employee_id: gap.employee_id,
                      course_id: matchingCourse.id,
                      status: 'not_started',
                      progress: 0,
                    })
                    courseCount++
                  }
                })
                addToast?.(`Learning plan generated with ${courseCount} courses for ${processedSkills.size} skill gaps`)
              }}>
                <GraduationCap size={16} className="mr-1" /> Generate Learning Plan
              </Button>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Target size={16} /> Organization-Wide Skill Gaps</CardTitle>
              </CardHeader>
              <div className="px-6 pb-6">
                <p className="text-xs text-t3 mb-4">Skills where the organization has the largest gaps between current proficiency and role requirements</p>
                {(() => {
                  // Compute org-wide gaps
                  const skillGapMap: Record<string, { name: string; totalGap: number; count: number; avgCurrent: number; avgRequired: number }> = {}
                  const lookup: Record<string, string> = {}
                  skills.forEach((s: any) => { lookup[s.id] = s.name })

                  roleRequirements.forEach((req: any) => {
                    const empWithSkill = employeeSkills.filter(es => es.skill_id === req.skill_id)
                    const avgCurrent = empWithSkill.length > 0
                      ? empWithSkill.reduce((sum: number, es: any) => sum + es.current_level, 0) / empWithSkill.length
                      : 0
                    const gap = req.required_level - avgCurrent
                    if (gap > 0) {
                      if (!skillGapMap[req.skill_id]) {
                        skillGapMap[req.skill_id] = { name: lookup[req.skill_id] || 'Unknown', totalGap: 0, count: 0, avgCurrent: 0, avgRequired: 0 }
                      }
                      skillGapMap[req.skill_id].totalGap += gap
                      skillGapMap[req.skill_id].count++
                      skillGapMap[req.skill_id].avgCurrent = avgCurrent
                      skillGapMap[req.skill_id].avgRequired = req.required_level
                    }
                  })

                  const sortedGaps = Object.entries(skillGapMap).sort((a, b) => b[1].totalGap - a[1].totalGap)

                  return sortedGaps.length === 0 ? (
                    <p className="text-sm text-t3 text-center py-4">No significant skill gaps detected</p>
                  ) : (
                    <div className="space-y-3">
                      {sortedGaps.map(([skillId, data]) => (
                        <div key={skillId} className="flex items-center gap-4 p-3 rounded-xl border border-border">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-t1">{data.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 bg-gray-100 rounded-full h-2 relative">
                                <div className="bg-red-400 h-2 rounded-full" style={{ width: `${(data.avgCurrent / 5) * 100}%` }} />
                                <div className="absolute top-0 w-0.5 h-2 bg-green-600" style={{ left: `${(data.avgRequired / 5) * 100}%` }} />
                              </div>
                              <span className="text-xs text-t3 whitespace-nowrap">
                                {Math.round(data.avgCurrent * 10) / 10} &rarr; {data.avgRequired}
                              </span>
                            </div>
                          </div>
                          <Badge variant="error">Gap: {Math.round(data.totalGap * 10) / 10}</Badge>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
            </Card>
          </div>
        )}

        {/* Team Heatmap Tab */}
        {activeTab === 'heatmap' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Flame size={16} /> Core Skills Heatmap</CardTitle>
            </CardHeader>
            <div className="px-6 pb-6 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="text-left pb-2 pr-4 text-t3 font-medium uppercase tracking-wide sticky left-0 bg-card">Employee</th>
                    {heatmapData.skills.map((skill: any) => (
                      <th key={skill.id} className="pb-2 px-2 text-center text-t3 font-medium uppercase tracking-wide whitespace-nowrap" style={{ minWidth: '80px' }}>
                        {skill.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {heatmapData.employees.map((empId: string) => (
                    <tr key={empId} className="border-t border-divider/30">
                      <td className="py-2 pr-4 sticky left-0 bg-card">
                        <div className="flex items-center gap-2">
                          <Avatar name={getEmployeeName(empId)} size="xs" />
                          <span className="text-t1 font-medium truncate max-w-[120px]">{getEmployeeName(empId)}</span>
                        </div>
                      </td>
                      {heatmapData.skills.map((skill: any) => {
                        const level = heatmapData.getLevel(empId, skill.id)
                        const bgColor = level === 0 ? 'bg-gray-50' :
                          level <= 1 ? 'bg-red-100' :
                          level <= 2 ? 'bg-orange-100' :
                          level <= 3 ? 'bg-yellow-100' :
                          level <= 4 ? 'bg-green-100' :
                          'bg-green-200'
                        const textColor = level === 0 ? 'text-gray-300' :
                          level <= 2 ? 'text-red-700' :
                          level <= 3 ? 'text-yellow-800' :
                          'text-green-800'
                        return (
                          <td key={skill.id} className="py-2 px-2 text-center">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-semibold ${bgColor} ${textColor}`}>
                              {level || '-'}
                            </span>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-divider">
                <span className="text-[0.6rem] text-t3 font-medium uppercase">Proficiency:</span>
                {PROFICIENCY_LEVELS.map(pl => (
                  <div key={pl.level} className="flex items-center gap-1">
                    <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-[0.55rem] font-semibold ${
                      pl.level <= 1 ? 'bg-red-100 text-red-700' :
                      pl.level <= 2 ? 'bg-orange-100 text-orange-700' :
                      pl.level <= 3 ? 'bg-yellow-100 text-yellow-800' :
                      pl.level <= 4 ? 'bg-green-100 text-green-700' :
                      'bg-green-200 text-green-800'
                    }`}>{pl.level}</span>
                    <span className="text-[0.55rem] text-t3">{pl.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Development Plans Tab */}
        {activeTab === 'development' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-t3">{devPlans.length} development plans</p>
              <Button onClick={() => setShowNewDevPlanModal(true)}><Plus size={16} className="mr-1" /> New Plan</Button>
            </div>

            {devPlans.map((plan: any) => {
              const planItems = devItems.filter((i: any) => i.plan_id === plan.id)
              const completedItems = planItems.filter((i: any) => i.status === 'completed').length
              const progress = planItems.length > 0 ? Math.round((completedItems / planItems.length) * 100) : 0
              return (
                <Card key={plan.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <Avatar name={getEmployeeName(plan.employee_id)} size="sm" />
                        <div>
                          <CardTitle>{plan.title}</CardTitle>
                          <p className="text-xs text-t3">{getEmployeeName(plan.employee_id)} &middot; Target: {plan.target_date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={plan.status === 'active' ? 'success' : plan.status === 'completed' ? 'info' : 'default'}>
                          {plan.status}
                        </Badge>
                        <span className="text-xs text-t3">{progress}%</span>
                      </div>
                    </div>
                  </CardHeader>
                  <div className="px-6 pb-6">
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4">
                      <div className="bg-tempo-500 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>

                    {plan.manager_notes && <p className="text-xs text-t3 italic mb-3">{plan.manager_notes}</p>}

                    <div className="space-y-2">
                      {planItems.map((item: any) => {
                        const typeDisplay = ITEM_TYPE_DISPLAY[item.type] || { label: item.type, icon: <Zap size={14} /> }
                        return (
                          <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 hover:bg-canvas/50 transition-colors">
                            <span className="text-t3">{typeDisplay.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-t1">{item.title}</p>
                              <div className="flex items-center gap-2 text-[0.6rem] text-t3">
                                <span>{typeDisplay.label}</span>
                                {item.skill_id && <span>&middot; {getSkillName(item.skill_id)}</span>}
                                {item.target_date && <span>&middot; Due {item.target_date}</span>}
                              </div>
                            </div>
                            <Badge variant={item.status === 'completed' ? 'success' : item.status === 'in_progress' ? 'orange' : 'default'}>
                              {item.status === 'not_started' ? 'Not Started' : item.status === 'in_progress' ? 'In Progress' : 'Completed'}
                            </Badge>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* Role Requirements Tab */}
        {activeTab === 'requirements' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Briefcase size={16} /> Role Skill Requirements</CardTitle>
            </CardHeader>
            <div className="px-6 pb-6">
              {(() => {
                const byRole: Record<string, { title: string; level?: string; reqs: any[] }> = {}
                roleRequirements.forEach((r: any) => {
                  const key = `${r.job_title}|${r.level || ''}`
                  if (!byRole[key]) byRole[key] = { title: r.job_title, level: r.level, reqs: [] }
                  byRole[key].reqs.push(r)
                })

                return Object.entries(byRole).map(([key, data]) => (
                  <div key={key} className="mb-6 last:mb-0">
                    <div className="flex items-center gap-2 mb-3">
                      <p className="text-sm font-semibold text-t1">{data.title}</p>
                      {data.level && <Badge variant="info">{data.level}</Badge>}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {data.reqs.map((req: any) => (
                        <div key={req.id} className="flex items-center gap-3 p-2 rounded-lg border border-border/50">
                          <span className="text-xs font-medium text-t1 flex-1">{getSkillName(req.skill_id)}</span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map(i => (
                              <div
                                key={i}
                                className={`w-2 h-2 rounded-full ${i <= req.required_level ? 'bg-tempo-500' : 'bg-gray-200'}`}
                              />
                            ))}
                          </div>
                          <Badge variant={req.importance === 'required' ? 'error' : req.importance === 'preferred' ? 'warning' : 'default'}>
                            {req.importance}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              })()}
            </div>
          </Card>
        )}
      </div>

      {/* New Skill Modal */}
      <Modal open={showNewSkillModal} onClose={() => setShowNewSkillModal(false)} title="Add New Skill">
        <div className="space-y-4">
          <Input label="Skill Name" value={newSkill.name} onChange={e => setNewSkill(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. Machine Learning" />
          <Select label="Category" value={newSkill.category} onChange={(e: any) => setNewSkill(prev => ({ ...prev, category: e.target.value }))} options={SKILL_CATEGORIES} />
          <Textarea label="Description" value={newSkill.description} onChange={e => setNewSkill(prev => ({ ...prev, description: e.target.value }))} placeholder="Brief description of this skill..." />
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isCore" checked={newSkill.isCore} onChange={e => setNewSkill(prev => ({ ...prev, isCore: e.target.checked }))} className="rounded border-gray-300" />
            <label htmlFor="isCore" className="text-xs text-t2">Core competency (required for all employees)</label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowNewSkillModal(false)}>Cancel</Button>
            <Button onClick={() => setShowNewSkillModal(false)}>Add Skill</Button>
          </div>
        </div>
      </Modal>

      {/* New Dev Plan Modal */}
      <Modal open={showNewDevPlanModal} onClose={() => setShowNewDevPlanModal(false)} title="Create Development Plan">
        <div className="space-y-4">
          <Input label="Plan Title" placeholder="e.g. Path to Senior Engineer" />
          <Select label="Employee" options={[{ value: '', label: 'Select Employee' }, ...employees.slice(0, 50).map((e: any) => ({ value: e.id, label: e.profile?.full_name || 'Unknown' }))]} />
          <Input label="Target Date" type="date" />
          <Textarea label="Manager Notes" placeholder="Goals, context, expectations..." />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowNewDevPlanModal(false)}>Cancel</Button>
            <Button onClick={() => setShowNewDevPlanModal(false)}>Create Plan</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
