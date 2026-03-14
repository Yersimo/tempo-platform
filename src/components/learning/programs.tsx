'use client'

import { useState, useMemo, useCallback } from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Progress } from '@/components/ui/progress'
import { Modal } from '@/components/ui/modal'
import { Input, Select, Textarea } from '@/components/ui/input'
import { cn } from '@/lib/utils/cn'
import {
  Plus, BookOpen, Users, Clock, ChevronRight, ArrowLeft, Trash2, GripVertical,
  Mail, Bell, Calendar, Target, TrendingUp, AlertTriangle, CheckCircle,
  BarChart3, Send, Play, Layers, Search, Filter, MoreVertical, Eye,
  UserPlus, Building2, Briefcase, CalendarClock, Unlock, Lock
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProgramSection {
  id: string
  name: string
  courseIds: string[]
  unlockDelay: number // days from enrollment
}

interface Program {
  id: string
  title: string
  description: string
  sections: ProgramSection[]
  status: 'draft' | 'active' | 'archived'
  autoEmails: { welcome: boolean; sectionUnlock: boolean; completion: boolean }
  createdAt: string
}

interface ProgramEnrollment {
  id: string
  programId: string
  employeeId: string
  enrolledAt: string
  startDate: string
  completedCourseIds: string[]
  inProgressCourseIds: string[]
  status: 'active' | 'completed' | 'dropped'
  lastActivity: string
}

interface ProgramsProps {
  courses: any[]
  employees: any[]
  departments: any[]
  enrollments: any[]
  getEmployeeName: (id: string) => string
  getDepartmentName: (id: string) => string
  addToast: (msg: string, type?: 'info' | 'error' | 'success') => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uid() {
  return 'prg_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function addDays(iso: string, days: number) {
  const d = new Date(iso)
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

// ---------------------------------------------------------------------------
// Seed data generator
// ---------------------------------------------------------------------------

function buildSeedData(courses: any[], employees: any[]): { programs: Program[]; programEnrollments: ProgramEnrollment[] } {
  if (courses.length < 3 || employees.length < 3) return { programs: [], programEnrollments: [] }

  const c = courses.slice(0, 12)

  const programs: Program[] = [
    {
      id: 'prg_onboard',
      title: 'New Hire Onboarding Program',
      description: 'A structured 4-week program to get new hires up to speed with company tools, culture, and role-specific training.',
      sections: [
        { id: 's1', name: 'Week 1: Foundations', courseIds: c.slice(0, 2).map(x => x.id), unlockDelay: 0 },
        { id: 's2', name: 'Week 2: Deep Dive', courseIds: c.slice(2, 4).map(x => x.id), unlockDelay: 7 },
        { id: 's3', name: 'Week 3: Collaboration', courseIds: c.slice(4, 6).map(x => x.id), unlockDelay: 14 },
        { id: 's4', name: 'Week 4: Mastery', courseIds: c.slice(6, 8).map(x => x.id), unlockDelay: 30 },
      ],
      status: 'active',
      autoEmails: { welcome: true, sectionUnlock: true, completion: true },
      createdAt: daysAgo(60),
    },
    {
      id: 'prg_leader',
      title: 'Leadership Accelerator',
      description: 'Fast-track leadership development for high-potential individual contributors transitioning into management roles.',
      sections: [
        { id: 's5', name: 'Phase 1: Self-Awareness', courseIds: c.slice(0, 3).map(x => x.id), unlockDelay: 0 },
        { id: 's6', name: 'Phase 2: Team Dynamics', courseIds: c.slice(3, 5).map(x => x.id), unlockDelay: 14 },
        { id: 's7', name: 'Phase 3: Strategic Thinking', courseIds: c.slice(5, 7).map(x => x.id), unlockDelay: 30 },
      ],
      status: 'active',
      autoEmails: { welcome: true, sectionUnlock: false, completion: true },
      createdAt: daysAgo(45),
    },
    {
      id: 'prg_compliance',
      title: 'Annual Compliance Bundle',
      description: 'Required annual compliance courses bundled into a single trackable program with staggered deadlines.',
      sections: [
        { id: 's8', name: 'Core Compliance', courseIds: c.slice(0, 2).map(x => x.id), unlockDelay: 0 },
        { id: 's9', name: 'Advanced Topics', courseIds: c.slice(2, 4).map(x => x.id), unlockDelay: 7 },
      ],
      status: 'draft',
      autoEmails: { welcome: true, sectionUnlock: true, completion: false },
      createdAt: daysAgo(10),
    },
  ]

  const enrolledEmps = employees.slice(0, Math.min(employees.length, 18))
  const programEnrollments: ProgramEnrollment[] = []

  enrolledEmps.forEach((emp, idx) => {
    const prog = programs[idx % 2] // enroll in first two active programs
    const allCourseIds = prog.sections.flatMap(s => s.courseIds)
    const completedCount = Math.floor(Math.random() * (allCourseIds.length + 1))
    const inProgressCount = completedCount < allCourseIds.length ? 1 : 0
    const completedIds = allCourseIds.slice(0, completedCount)
    const inProgressIds = inProgressCount ? [allCourseIds[completedCount]] : []
    const isCompleted = completedCount === allCourseIds.length

    programEnrollments.push({
      id: uid(),
      programId: prog.id,
      employeeId: emp.id,
      enrolledAt: daysAgo(30 + Math.floor(Math.random() * 30)),
      startDate: daysAgo(25 + Math.floor(Math.random() * 20)),
      completedCourseIds: completedIds,
      inProgressCourseIds: inProgressIds,
      status: isCompleted ? 'completed' : Math.random() > 0.9 ? 'dropped' : 'active',
      lastActivity: daysAgo(Math.floor(Math.random() * 14)),
    })
  })

  return { programs, programEnrollments }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Programs({ courses, employees, departments, enrollments, getEmployeeName, getDepartmentName, addToast }: ProgramsProps) {
  // Seed on first render
  const seed = useMemo(() => buildSeedData(courses, employees), [courses.length, employees.length])

  const [programs, setPrograms] = useState<Program[]>(seed.programs)
  const [programEnrollments, setProgramEnrollments] = useState<ProgramEnrollment[]>(seed.programEnrollments)

  // View state
  const [view, setView] = useState<'dashboard' | 'detail' | 'create'>('dashboard')
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft' | 'archived'>('all')

  // Create/edit modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [programForm, setProgramForm] = useState({
    title: '',
    description: '',
    sections: [{ id: uid(), name: 'Section 1', courseIds: [] as string[], unlockDelay: 0 }] as ProgramSection[],
    autoEmails: { welcome: true, sectionUnlock: true, completion: true },
  })

  // Enrollment modal state
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [enrollMode, setEnrollMode] = useState<'individual' | 'department' | 'role'>('individual')
  const [enrollSearch, setEnrollSearch] = useState('')
  const [selectedEnrollees, setSelectedEnrollees] = useState<Set<string>>(new Set())
  const [enrollStartDate, setEnrollStartDate] = useState(new Date().toISOString().split('T')[0])
  const [enrollStep, setEnrollStep] = useState<1 | 2>(1)
  const [enrollDept, setEnrollDept] = useState('')
  const [enrollRole, setEnrollRole] = useState('')

  // Nudge modal
  const [showNudgeModal, setShowNudgeModal] = useState(false)
  const [nudgeMessage, setNudgeMessage] = useState('Hi! Just a friendly reminder to continue your learning program. Your team is counting on you!')

  // Course selector modal for sections
  const [showCourseSelector, setShowCourseSelector] = useState(false)
  const [courseSelectorTarget, setCourseSelectorTarget] = useState<number>(0)
  const [courseSelectorSearch, setCourseSelectorSearch] = useState('')

  // Computed
  const selectedProgram = useMemo(() => programs.find(p => p.id === selectedProgramId), [programs, selectedProgramId])
  const selectedEnrollmentsList = useMemo(
    () => programEnrollments.filter(e => e.programId === selectedProgramId),
    [programEnrollments, selectedProgramId]
  )

  const filteredPrograms = useMemo(() => {
    return programs.filter(p => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false
      if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
  }, [programs, statusFilter, searchQuery])

  // Stats
  const totalEnrolled = useMemo(() => new Set(programEnrollments.map(e => e.employeeId)).size, [programEnrollments])
  const avgCompletion = useMemo(() => {
    if (programEnrollments.length === 0) return 0
    const rates = programEnrollments.map(e => {
      const prog = programs.find(p => p.id === e.programId)
      if (!prog) return 0
      const total = prog.sections.flatMap(s => s.courseIds).length
      return total > 0 ? (e.completedCourseIds.length / total) * 100 : 0
    })
    return Math.round(rates.reduce((a, b) => a + b, 0) / rates.length)
  }, [programEnrollments, programs])

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  function getProgramStats(prog: Program) {
    const enrolls = programEnrollments.filter(e => e.programId === prog.id)
    const totalCourses = prog.sections.flatMap(s => s.courseIds).length
    const avgPct = enrolls.length > 0
      ? Math.round(enrolls.reduce((acc, e) => acc + (totalCourses > 0 ? (e.completedCourseIds.length / totalCourses) * 100 : 0), 0) / enrolls.length)
      : 0
    const completedCount = enrolls.filter(e => e.status === 'completed').length
    const dropoutCount = enrolls.filter(e => e.status === 'dropped').length
    return { enrolled: enrolls.length, totalCourses, avgPct, completedCount, dropoutCount }
  }

  function openDetail(id: string) {
    setSelectedProgramId(id)
    setView('detail')
  }

  function handleCreateProgram() {
    if (!programForm.title.trim()) return
    const newProg: Program = {
      id: uid(),
      title: programForm.title,
      description: programForm.description,
      sections: programForm.sections,
      status: 'draft',
      autoEmails: programForm.autoEmails,
      createdAt: new Date().toISOString(),
    }
    setPrograms(prev => [...prev, newProg])
    setShowCreateModal(false)
    setProgramForm({
      title: '', description: '',
      sections: [{ id: uid(), name: 'Section 1', courseIds: [], unlockDelay: 0 }],
      autoEmails: { welcome: true, sectionUnlock: true, completion: true },
    })
    addToast('Program created successfully')
  }

  function addSection() {
    setProgramForm(f => ({
      ...f,
      sections: [...f.sections, { id: uid(), name: `Section ${f.sections.length + 1}`, courseIds: [], unlockDelay: f.sections.length * 7 }]
    }))
  }

  function removeSection(idx: number) {
    setProgramForm(f => ({ ...f, sections: f.sections.filter((_, i) => i !== idx) }))
  }

  function updateSection(idx: number, updates: Partial<ProgramSection>) {
    setProgramForm(f => ({
      ...f,
      sections: f.sections.map((s, i) => i === idx ? { ...s, ...updates } : s)
    }))
  }

  function openCourseSelector(sectionIdx: number) {
    setCourseSelectorTarget(sectionIdx)
    setCourseSelectorSearch('')
    setShowCourseSelector(true)
  }

  function toggleCourseInSection(courseId: string) {
    const section = programForm.sections[courseSelectorTarget]
    const has = section.courseIds.includes(courseId)
    updateSection(courseSelectorTarget, {
      courseIds: has ? section.courseIds.filter(c => c !== courseId) : [...section.courseIds, courseId]
    })
  }

  function activateProgram(id: string) {
    setPrograms(prev => prev.map(p => p.id === id ? { ...p, status: 'active' } : p))
    addToast('Program activated')
  }

  function archiveProgram(id: string) {
    setPrograms(prev => prev.map(p => p.id === id ? { ...p, status: 'archived' } : p))
    addToast('Program archived')
  }

  // Enrollment
  function getResolvedEnrollees(): string[] {
    if (enrollMode === 'individual') return Array.from(selectedEnrollees)
    if (enrollMode === 'department' && enrollDept) {
      return employees.filter(e => (e.department_id || e.departmentId) === enrollDept).map(e => e.id)
    }
    if (enrollMode === 'role' && enrollRole) {
      return employees.filter(e => (e.job_title || e.jobTitle || '').toLowerCase().includes(enrollRole.toLowerCase())).map(e => e.id)
    }
    return []
  }

  function handleEnroll() {
    if (!selectedProgramId) return
    const ids = getResolvedEnrollees()
    const existing = new Set(programEnrollments.filter(e => e.programId === selectedProgramId).map(e => e.employeeId))
    const newEnrollments: ProgramEnrollment[] = ids
      .filter(id => !existing.has(id))
      .map(employeeId => ({
        id: uid(),
        programId: selectedProgramId,
        employeeId,
        enrolledAt: new Date().toISOString(),
        startDate: new Date(enrollStartDate).toISOString(),
        completedCourseIds: [],
        inProgressCourseIds: [],
        status: 'active' as const,
        lastActivity: new Date().toISOString(),
      }))
    if (newEnrollments.length === 0) {
      addToast('All selected employees are already enrolled', 'info')
      return
    }
    setProgramEnrollments(prev => [...prev, ...newEnrollments])
    setShowEnrollModal(false)
    setSelectedEnrollees(new Set())
    setEnrollStep(1)
    setEnrollDept('')
    setEnrollRole('')
    addToast(`${newEnrollments.length} learner${newEnrollments.length > 1 ? 's' : ''} enrolled`)
  }

  function handleNudge() {
    addToast('Reminder emails sent to lagging learners')
    setShowNudgeModal(false)
  }

  // ---------------------------------------------------------------------------
  // Sub-components
  // ---------------------------------------------------------------------------

  function getCourseName(id: string) {
    return courses.find(c => c.id === id)?.title || 'Unknown Course'
  }

  // Learner progress for heatmap
  function getLearnerCourseStatus(enrollment: ProgramEnrollment, courseId: string): 'completed' | 'in_progress' | 'not_started' {
    if (enrollment.completedCourseIds.includes(courseId)) return 'completed'
    if (enrollment.inProgressCourseIds.includes(courseId)) return 'in_progress'
    return 'not_started'
  }

  function getEnrollmentProgress(enrollment: ProgramEnrollment): number {
    if (!selectedProgram) return 0
    const total = selectedProgram.sections.flatMap(s => s.courseIds).length
    return total > 0 ? Math.round((enrollment.completedCourseIds.length / total) * 100) : 0
  }

  function getCurrentSection(enrollment: ProgramEnrollment): string {
    if (!selectedProgram) return '-'
    for (let i = selectedProgram.sections.length - 1; i >= 0; i--) {
      const section = selectedProgram.sections[i]
      if (section.courseIds.some(cid => enrollment.completedCourseIds.includes(cid) || enrollment.inProgressCourseIds.includes(cid))) {
        return section.name
      }
    }
    return selectedProgram.sections[0]?.name || '-'
  }

  // ---------------------------------------------------------------------------
  // Render: Dashboard
  // ---------------------------------------------------------------------------

  if (view === 'dashboard') {
    return (
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Total Programs" value={programs.length} icon={<Layers size={20} />} change={`${programs.filter(p => p.status === 'active').length} active`} changeType="neutral" />
          <StatCard label="Total Enrolled" value={totalEnrolled} icon={<Users size={20} />} change="+12 this month" changeType="positive" />
          <StatCard label="Avg Completion" value={`${avgCompletion}%`} icon={<Target size={20} />} change="+5% vs last month" changeType="positive" />
          <StatCard label="Active Learners" value={programEnrollments.filter(e => e.status === 'active').length} icon={<TrendingUp size={20} />} change={`${programEnrollments.filter(e => e.status === 'dropped').length} dropped`} changeType="neutral" />
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
              <input
                className="pl-9 pr-3 py-2 text-sm bg-white border border-divider rounded-[var(--radius-input)] text-t1 placeholder:text-t3 focus:outline-none focus:ring-2 focus:ring-tempo-600/20 focus:border-tempo-600 w-64"
                placeholder="Search programs..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <Select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'draft', label: 'Draft' },
                { value: 'archived', label: 'Archived' },
              ]}
            />
          </div>
          <Button onClick={() => setShowCreateModal(true)} size="sm">
            <Plus size={14} /> Create Program
          </Button>
        </div>

        {/* Program Grid */}
        {filteredPrograms.length === 0 ? (
          <Card className="text-center py-16">
            <Layers size={40} className="mx-auto text-t3 mb-3 opacity-50" />
            <p className="text-sm text-t2 font-medium mb-1">No programs found</p>
            <p className="text-xs text-t3 mb-4">Create your first learning program to get started</p>
            <Button onClick={() => setShowCreateModal(true)} size="sm"><Plus size={14} /> Create Program</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPrograms.map(prog => {
              const stats = getProgramStats(prog)
              return (
                <Card
                  key={prog.id}
                  className="hover:border-tempo-400/40 transition-all cursor-pointer group"
                  onClick={() => openDetail(prog.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-t1 truncate">{prog.title}</h3>
                      </div>
                      <p className="text-xs text-t3 line-clamp-2">{prog.description}</p>
                    </div>
                    <Badge variant={prog.status === 'active' ? 'success' : prog.status === 'draft' ? 'warning' : 'info'}>
                      {prog.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="text-center p-2 bg-canvas rounded-lg">
                      <p className="text-base font-bold text-t1">{stats.totalCourses}</p>
                      <p className="text-[0.6rem] text-t3">Courses</p>
                    </div>
                    <div className="text-center p-2 bg-canvas rounded-lg">
                      <p className="text-base font-bold text-t1">{stats.enrolled}</p>
                      <p className="text-[0.6rem] text-t3">Enrolled</p>
                    </div>
                    <div className="text-center p-2 bg-canvas rounded-lg">
                      <p className="text-base font-bold text-tempo-600">{stats.avgPct}%</p>
                      <p className="text-[0.6rem] text-t3">Avg Progress</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[0.6rem] text-t3">
                      <Layers size={10} />
                      <span>{prog.sections.length} sections</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-tempo-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>View details</span>
                      <ChevronRight size={12} />
                    </div>
                  </div>

                  <Progress value={stats.avgPct} className="mt-3" />
                </Card>
              )
            })}
          </div>
        )}

        {/* Create Program Modal */}
        <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Learning Program" description="Design a structured program with phased course delivery" size="xl">
          <div className="space-y-5">
            <Input label="Program Title" value={programForm.title} onChange={e => setProgramForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. New Hire Onboarding Program" />
            <Textarea label="Description" value={programForm.description} onChange={e => setProgramForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the program goals and target audience..." rows={3} />

            {/* Sections */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-medium text-t1">Program Sections</label>
                <Button variant="ghost" size="sm" onClick={addSection}><Plus size={12} /> Add Section</Button>
              </div>

              <div className="space-y-3">
                {programForm.sections.map((section, idx) => (
                  <div key={section.id} className="border border-divider rounded-lg p-4 bg-canvas/50">
                    <div className="flex items-center gap-3 mb-3">
                      <GripVertical size={14} className="text-t3 cursor-grab" />
                      <input
                        className="flex-1 bg-transparent text-sm font-medium text-t1 border-none focus:outline-none placeholder:text-t3"
                        value={section.name}
                        onChange={e => updateSection(idx, { name: e.target.value })}
                        placeholder="Section name..."
                      />
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 text-xs text-t3">
                          <Clock size={12} />
                          <span>Unlock after</span>
                        </div>
                        <input
                          type="number"
                          min={0}
                          className="w-16 px-2 py-1 text-xs bg-white border border-divider rounded text-t1 text-center focus:outline-none focus:ring-2 focus:ring-tempo-600/20"
                          value={section.unlockDelay}
                          onChange={e => updateSection(idx, { unlockDelay: Number(e.target.value) })}
                        />
                        <span className="text-xs text-t3">days</span>
                      </div>
                      {programForm.sections.length > 1 && (
                        <button onClick={() => removeSection(idx)} className="text-t3 hover:text-error transition-colors p-1">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    {/* Course chips */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {section.courseIds.map(cid => (
                        <span key={cid} className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-divider rounded text-[0.65rem] text-t2">
                          <BookOpen size={10} />
                          {getCourseName(cid)}
                          <button
                            onClick={() => updateSection(idx, { courseIds: section.courseIds.filter(c => c !== cid) })}
                            className="text-t3 hover:text-error ml-0.5"
                          >
                            <Trash2 size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => openCourseSelector(idx)}>
                      <Plus size={12} /> Add Courses
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Auto Emails */}
            <div>
              <label className="text-xs font-medium text-t1 mb-2 block">Automated Emails</label>
              <div className="flex flex-wrap gap-4">
                {[
                  { key: 'welcome' as const, label: 'Welcome Email', icon: Mail },
                  { key: 'sectionUnlock' as const, label: 'Section Unlock', icon: Unlock },
                  { key: 'completion' as const, label: 'Completion', icon: CheckCircle },
                ].map(({ key, label, icon: Icon }) => (
                  <label key={key} className="flex items-center gap-2 text-xs text-t2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={programForm.autoEmails[key]}
                      onChange={e => setProgramForm(f => ({ ...f, autoEmails: { ...f.autoEmails, [key]: e.target.checked } }))}
                      className="rounded border-divider"
                    />
                    <Icon size={12} />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button onClick={handleCreateProgram} disabled={!programForm.title.trim()}>Create Program</Button>
            </div>
          </div>
        </Modal>

        {/* Course Selector Modal */}
        <Modal open={showCourseSelector} onClose={() => setShowCourseSelector(false)} title="Select Courses" size="lg">
          <div className="space-y-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
              <input
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-divider rounded-[var(--radius-input)] text-t1 placeholder:text-t3 focus:outline-none focus:ring-2 focus:ring-tempo-600/20"
                placeholder="Search courses..."
                value={courseSelectorSearch}
                onChange={e => setCourseSelectorSearch(e.target.value)}
              />
            </div>
            <div className="max-h-80 overflow-y-auto space-y-1">
              {courses
                .filter(c => !courseSelectorSearch || c.title?.toLowerCase().includes(courseSelectorSearch.toLowerCase()))
                .map(c => {
                  const isSelected = programForm.sections[courseSelectorTarget]?.courseIds.includes(c.id)
                  return (
                    <button
                      key={c.id}
                      onClick={() => toggleCourseInSection(c.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                        isSelected ? 'bg-tempo-50 border border-tempo-200' : 'hover:bg-canvas border border-transparent'
                      )}
                    >
                      <div className={cn(
                        'w-5 h-5 rounded border flex items-center justify-center flex-shrink-0',
                        isSelected ? 'bg-tempo-600 border-tempo-600' : 'border-divider'
                      )}>
                        {isSelected && <CheckCircle size={12} className="text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-t1 truncate">{c.title}</p>
                        <p className="text-[0.6rem] text-t3">{c.category || 'General'} &middot; {c.duration_hours || c.durationHours || '—'}h &middot; {c.level || 'All levels'}</p>
                      </div>
                    </button>
                  )
                })}
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={() => setShowCourseSelector(false)}>Done ({programForm.sections[courseSelectorTarget]?.courseIds.length || 0} selected)</Button>
            </div>
          </div>
        </Modal>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render: Detail View
  // ---------------------------------------------------------------------------

  if (view === 'detail' && selectedProgram) {
    const stats = getProgramStats(selectedProgram)
    const allCourseIds = selectedProgram.sections.flatMap(s => s.courseIds)
    const activeEnrollments = selectedEnrollmentsList.filter(e => e.status === 'active')
    const laggingLearners = activeEnrollments.filter(e => {
      const pct = getEnrollmentProgress(e)
      const daysSinceStart = Math.floor((Date.now() - new Date(e.startDate).getTime()) / (1000 * 60 * 60 * 24))
      return pct < 30 && daysSinceStart > 14
    })

    const dropoutRate = selectedEnrollmentsList.length > 0
      ? Math.round((selectedEnrollmentsList.filter(e => e.status === 'dropped').length / selectedEnrollmentsList.length) * 100)
      : 0

    const completedEnrolls = selectedEnrollmentsList.filter(e => e.status === 'completed')
    const avgTimeToComplete = completedEnrolls.length > 0
      ? Math.round(completedEnrolls.reduce((acc, e) => {
          const days = Math.floor((new Date(e.lastActivity).getTime() - new Date(e.startDate).getTime()) / (1000 * 60 * 60 * 24))
          return acc + Math.max(days, 1)
        }, 0) / completedEnrolls.length)
      : 0

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setView('dashboard')} className="text-t3 hover:text-t1 transition-colors p-1.5 rounded-lg hover:bg-canvas">
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-t1">{selectedProgram.title}</h2>
                <Badge variant={selectedProgram.status === 'active' ? 'success' : selectedProgram.status === 'draft' ? 'warning' : 'info'}>
                  {selectedProgram.status}
                </Badge>
              </div>
              <p className="text-xs text-t3 mt-0.5">{selectedProgram.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedProgram.status === 'draft' && (
              <Button variant="secondary" size="sm" onClick={() => activateProgram(selectedProgram.id)}>
                <Play size={12} /> Activate
              </Button>
            )}
            {selectedProgram.status === 'active' && (
              <Button variant="ghost" size="sm" onClick={() => archiveProgram(selectedProgram.id)}>Archive</Button>
            )}
            <Button size="sm" onClick={() => { setShowEnrollModal(true); setEnrollStep(1) }}>
              <UserPlus size={12} /> Enroll Learners
            </Button>
            {laggingLearners.length > 0 && (
              <Button variant="secondary" size="sm" onClick={() => setShowNudgeModal(true)}>
                <Send size={12} /> Nudge ({laggingLearners.length})
              </Button>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-5 gap-4">
          <StatCard label="Enrolled" value={stats.enrolled} icon={<Users size={18} />} />
          <StatCard label="Completion Rate" value={`${stats.enrolled > 0 ? Math.round((stats.completedCount / stats.enrolled) * 100) : 0}%`} icon={<Target size={18} />} />
          <StatCard label="Avg Time to Complete" value={avgTimeToComplete > 0 ? `${avgTimeToComplete}d` : '-'} icon={<Clock size={18} />} />
          <StatCard label="Dropout Rate" value={`${dropoutRate}%`} icon={<AlertTriangle size={18} />} change={dropoutRate > 15 ? 'Above threshold' : 'Healthy'} changeType={dropoutRate > 15 ? 'negative' : 'positive'} />
          <StatCard label="Avg Progress" value={`${stats.avgPct}%`} icon={<BarChart3 size={18} />} />
        </div>

        {/* Section Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Program Timeline</CardTitle>
          </CardHeader>
          <div className="p-6">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-px bg-divider" />

              {selectedProgram.sections.map((section, idx) => {
                const sectionCourses = section.courseIds.map(cid => courses.find(c => c.id === cid)).filter(Boolean)
                const isFirst = idx === 0
                return (
                  <div key={section.id} className="relative pl-12 pb-8 last:pb-0">
                    {/* Timeline dot */}
                    <div className={cn(
                      'absolute left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center',
                      isFirst ? 'bg-tempo-600 border-tempo-600' : 'bg-white border-divider'
                    )}>
                      {isFirst ? <Unlock size={10} className="text-white" /> : <Lock size={10} className="text-t3" />}
                    </div>

                    <div className="bg-canvas rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-t1">{section.name}</h4>
                        <Badge variant={isFirst ? 'success' : 'default'}>
                          {isFirst ? 'Unlocked at enrollment' : `Unlocks Day ${section.unlockDelay}`}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {sectionCourses.map(c => (
                          <span key={c.id} className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-divider rounded text-[0.65rem] text-t2">
                            <BookOpen size={10} className="text-tempo-500" />
                            {c.title}
                          </span>
                        ))}
                        {sectionCourses.length === 0 && (
                          <span className="text-[0.65rem] text-t3 italic">No courses assigned</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>

        {/* Heatmap */}
        {activeEnrollments.length > 0 && allCourseIds.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Learner Progress Heatmap</CardTitle>
                <div className="flex items-center gap-4 text-[0.6rem]">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-gray-200" /> Not Started</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-400" /> In Progress</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-500" /> Completed</span>
                </div>
              </div>
            </CardHeader>
            <div className="p-6 overflow-x-auto">
              <div className="min-w-[600px]">
                {/* Column headers */}
                <div className="flex">
                  <div className="w-40 flex-shrink-0" />
                  {allCourseIds.map(cid => (
                    <div key={cid} className="flex-1 px-0.5">
                      <div className="text-[0.55rem] text-t3 font-medium truncate -rotate-45 origin-left translate-y-1 w-20 mb-4">
                        {getCourseName(cid)}
                      </div>
                    </div>
                  ))}
                  <div className="w-16 flex-shrink-0 text-[0.55rem] text-t3 font-medium text-center">Total</div>
                </div>

                {/* Rows */}
                <div className="space-y-1 mt-8">
                  {activeEnrollments.slice(0, 25).map(enrollment => {
                    const pct = getEnrollmentProgress(enrollment)
                    return (
                      <div key={enrollment.id} className="flex items-center">
                        <div className="w-40 flex-shrink-0 text-xs text-t2 truncate pr-3">
                          {getEmployeeName(enrollment.employeeId)}
                        </div>
                        {allCourseIds.map(cid => {
                          const status = getLearnerCourseStatus(enrollment, cid)
                          return (
                            <div key={cid} className="flex-1 px-0.5">
                              <div
                                className={cn(
                                  'h-7 rounded-sm transition-colors cursor-default',
                                  status === 'completed' && 'bg-emerald-500 hover:bg-emerald-400',
                                  status === 'in_progress' && 'bg-amber-400 hover:bg-amber-300',
                                  status === 'not_started' && 'bg-gray-100 hover:bg-gray-200'
                                )}
                                title={`${getEmployeeName(enrollment.employeeId)}: ${getCourseName(cid)} - ${status.replace('_', ' ')}`}
                              />
                            </div>
                          )
                        })}
                        <div className="w-16 flex-shrink-0 text-center">
                          <span className={cn(
                            'text-xs font-semibold tabular-nums',
                            pct === 100 ? 'text-emerald-600' : pct > 50 ? 'text-amber-600' : 'text-t3'
                          )}>
                            {pct}%
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Enrolled Learners Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Enrolled Learners ({selectedEnrollmentsList.length})</CardTitle>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-divider">
                  <th className="text-left px-6 py-3 text-t3 font-medium">Learner</th>
                  <th className="text-left px-4 py-3 text-t3 font-medium">Enrolled</th>
                  <th className="text-left px-4 py-3 text-t3 font-medium">Progress</th>
                  <th className="text-left px-4 py-3 text-t3 font-medium">Current Section</th>
                  <th className="text-left px-4 py-3 text-t3 font-medium">Last Activity</th>
                  <th className="text-left px-4 py-3 text-t3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {selectedEnrollmentsList.map(enrollment => {
                  const pct = getEnrollmentProgress(enrollment)
                  return (
                    <tr key={enrollment.id} className="border-b border-divider last:border-0 hover:bg-canvas/50">
                      <td className="px-6 py-3 font-medium text-t1">{getEmployeeName(enrollment.employeeId)}</td>
                      <td className="px-4 py-3 text-t3">{formatDate(enrollment.enrolledAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 w-32">
                          <Progress value={pct} size="sm" color={pct === 100 ? 'success' : pct > 50 ? 'orange' : 'warning'} />
                          <span className="text-t2 tabular-nums">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-t2">{getCurrentSection(enrollment)}</td>
                      <td className="px-4 py-3 text-t3">{formatDate(enrollment.lastActivity)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={enrollment.status === 'completed' ? 'success' : enrollment.status === 'dropped' ? 'error' : 'info'}>
                          {enrollment.status}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
                {selectedEnrollmentsList.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-t3">
                      No learners enrolled yet. Click "Enroll Learners" to add participants.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Enroll Modal */}
        <Modal open={showEnrollModal} onClose={() => setShowEnrollModal(false)} title={`Enroll in: ${selectedProgram.title}`} size="xl">
          <div className="space-y-4">
            {/* Step indicator */}
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-2">
                <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold', enrollStep >= 1 ? 'bg-tempo-600 text-white' : 'bg-gray-200 text-t3')}>
                  {enrollStep > 1 ? <CheckCircle size={14} /> : '1'}
                </div>
                <span className={cn('text-xs font-medium', enrollStep >= 1 ? 'text-t1' : 'text-t3')}>Select Learners</span>
              </div>
              <div className="flex-1 h-px bg-divider" />
              <div className="flex items-center gap-2">
                <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold', enrollStep >= 2 ? 'bg-tempo-600 text-white' : 'bg-gray-200 text-t3')}>2</div>
                <span className={cn('text-xs font-medium', enrollStep >= 2 ? 'text-t1' : 'text-t3')}>Set Start Date</span>
              </div>
            </div>

            {enrollStep === 1 && (
              <>
                <div className="flex gap-2">
                  {([
                    { key: 'individual', label: 'Individual', icon: Users },
                    { key: 'department', label: 'By Department', icon: Building2 },
                    { key: 'role', label: 'By Role', icon: Briefcase },
                  ] as const).map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setEnrollMode(key)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border transition-colors',
                        enrollMode === key ? 'border-tempo-500 bg-tempo-50 text-tempo-700' : 'border-divider text-t2 hover:bg-canvas'
                      )}
                    >
                      <Icon size={12} />
                      {label}
                    </button>
                  ))}
                </div>

                {enrollMode === 'individual' && (
                  <>
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
                      <input
                        className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-divider rounded-[var(--radius-input)] text-t1 placeholder:text-t3 focus:outline-none focus:ring-2 focus:ring-tempo-600/20"
                        placeholder="Search employees..."
                        value={enrollSearch}
                        onChange={e => setEnrollSearch(e.target.value)}
                      />
                    </div>
                    <div className="max-h-56 overflow-y-auto space-y-1">
                      {employees
                        .filter(e => {
                          const name = getEmployeeName(e.id).toLowerCase()
                          return !enrollSearch || name.includes(enrollSearch.toLowerCase())
                        })
                        .slice(0, 50)
                        .map(emp => (
                          <button
                            key={emp.id}
                            onClick={() => {
                              const next = new Set(selectedEnrollees)
                              next.has(emp.id) ? next.delete(emp.id) : next.add(emp.id)
                              setSelectedEnrollees(next)
                            }}
                            className={cn(
                              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
                              selectedEnrollees.has(emp.id) ? 'bg-tempo-50 border border-tempo-200' : 'hover:bg-canvas border border-transparent'
                            )}
                          >
                            <div className={cn(
                              'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0',
                              selectedEnrollees.has(emp.id) ? 'bg-tempo-600 border-tempo-600' : 'border-divider'
                            )}>
                              {selectedEnrollees.has(emp.id) && <CheckCircle size={10} className="text-white" />}
                            </div>
                            <div>
                              <p className="text-sm text-t1">{getEmployeeName(emp.id)}</p>
                              <p className="text-[0.6rem] text-t3">{emp.job_title || emp.jobTitle || 'Employee'} &middot; {getDepartmentName(emp.department_id || emp.departmentId || '')}</p>
                            </div>
                          </button>
                        ))}
                    </div>
                    <p className="text-xs text-t3">{selectedEnrollees.size} selected</p>
                  </>
                )}

                {enrollMode === 'department' && (
                  <Select
                    label="Department"
                    value={enrollDept}
                    onChange={e => setEnrollDept(e.target.value)}
                    options={[
                      { value: '', label: 'Select department...' },
                      ...departments.map(d => ({ value: d.id, label: d.name || getDepartmentName(d.id) }))
                    ]}
                  />
                )}

                {enrollMode === 'role' && (
                  <Input
                    label="Job Title (partial match)"
                    value={enrollRole}
                    onChange={e => setEnrollRole(e.target.value)}
                    placeholder="e.g. Engineer, Manager, Designer"
                  />
                )}

                {(enrollMode !== 'individual' || selectedEnrollees.size > 0) && (
                  <div className="bg-canvas rounded-lg p-3 text-xs text-t2">
                    <strong>{getResolvedEnrollees().length}</strong> employees will be enrolled
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    onClick={() => setEnrollStep(2)}
                    disabled={getResolvedEnrollees().length === 0}
                  >
                    Next <ChevronRight size={14} />
                  </Button>
                </div>
              </>
            )}

            {enrollStep === 2 && (
              <>
                <Input
                  label="Program Start Date"
                  type="date"
                  value={enrollStartDate}
                  onChange={e => setEnrollStartDate(e.target.value)}
                />

                {/* Unlock Timeline Preview */}
                <div>
                  <label className="text-xs font-medium text-t1 mb-2 block">Unlock Schedule Preview</label>
                  <div className="space-y-2">
                    {selectedProgram.sections.map((section, idx) => {
                      const unlockDate = addDays(enrollStartDate, section.unlockDelay)
                      return (
                        <div key={section.id} className="flex items-center gap-3 px-3 py-2 bg-canvas rounded-lg">
                          <div className={cn(
                            'w-6 h-6 rounded-full flex items-center justify-center text-[0.6rem] font-bold',
                            idx === 0 ? 'bg-tempo-600 text-white' : 'bg-white border border-divider text-t3'
                          )}>
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-t1">{section.name}</p>
                            <p className="text-[0.6rem] text-t3">{section.courseIds.length} course{section.courseIds.length !== 1 ? 's' : ''}</p>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-t2">
                            <CalendarClock size={12} />
                            {formatDate(unlockDate)}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="bg-canvas rounded-lg p-3 text-xs text-t2">
                  Enrolling <strong>{getResolvedEnrollees().length}</strong> learner{getResolvedEnrollees().length !== 1 ? 's' : ''} starting {formatDate(enrollStartDate)}
                </div>

                <div className="flex justify-between">
                  <Button variant="ghost" onClick={() => setEnrollStep(1)}>
                    <ArrowLeft size={14} /> Back
                  </Button>
                  <Button onClick={handleEnroll}>
                    <UserPlus size={14} /> Confirm Enrollment
                  </Button>
                </div>
              </>
            )}
          </div>
        </Modal>

        {/* Nudge Modal */}
        <Modal open={showNudgeModal} onClose={() => setShowNudgeModal(false)} title="Send Reminder to Lagging Learners">
          <div className="space-y-4">
            <div className="bg-canvas rounded-lg p-3 text-xs text-t2">
              <strong>{laggingLearners.length}</strong> learner{laggingLearners.length !== 1 ? 's' : ''} are behind schedule (less than 30% progress after 14+ days)
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {laggingLearners.map(e => (
                <div key={e.id} className="flex items-center justify-between px-3 py-1.5 text-xs">
                  <span className="text-t1">{getEmployeeName(e.employeeId)}</span>
                  <span className="text-t3">{getEnrollmentProgress(e)}% complete</span>
                </div>
              ))}
            </div>
            <Textarea
              label="Reminder Message"
              value={nudgeMessage}
              onChange={e => setNudgeMessage(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setShowNudgeModal(false)}>Cancel</Button>
              <Button onClick={handleNudge}><Send size={14} /> Send Reminders</Button>
            </div>
          </div>
        </Modal>
      </div>
    )
  }

  // Fallback
  return (
    <Card className="text-center py-16">
      <Layers size={40} className="mx-auto text-t3 mb-3 opacity-50" />
      <p className="text-sm text-t2">Select a program to view details</p>
      <Button variant="ghost" size="sm" className="mt-3" onClick={() => setView('dashboard')}>Back to Programs</Button>
    </Card>
  )
}
