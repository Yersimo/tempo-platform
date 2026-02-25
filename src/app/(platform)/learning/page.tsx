'use client'

import { useState, useMemo } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Progress } from '@/components/ui/progress'
import { Tabs } from '@/components/ui/tabs'
import { Modal } from '@/components/ui/modal'
import { Input, Select, Textarea } from '@/components/ui/input'
import { GraduationCap, BookOpen, Award, Plus, Clock, Sparkles, Radio, Route, Video, Zap, Users as UsersIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useTempo } from '@/lib/store'
import { AIInsightCard, AIScoreBadge } from '@/components/ai'
import { analyzeSkillGaps, predictCourseCompletion, generateCourseOutline, suggestLearningPathOrder } from '@/lib/ai-engine'
import { aiBuilderTemplates } from '@/lib/demo-data'

export default function LearningPage() {
  const { courses, enrollments, learningPaths, liveSessions, employees, addCourse, addEnrollment, updateEnrollment, addLearningPath, addLiveSession, getEmployeeName, currentEmployeeId } = useTempo()
  const t = useTranslations('learning')
  const tc = useTranslations('common')
  const [activeTab, setActiveTab] = useState('catalog')
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    category: 'Leadership',
    duration_hours: 8,
    format: 'online' as string,
    level: 'beginner' as string,
    is_mandatory: false,
  })
  const [enrollForm, setEnrollForm] = useState({
    employee_id: '',
    course_id: '',
  })

  // AI Builder state
  const [showBuilderModal, setShowBuilderModal] = useState(false)
  const [builderForm, setBuilderForm] = useState({ topic: '', level: 'beginner' as string, duration: 8 })
  const [generatedOutline, setGeneratedOutline] = useState<ReturnType<typeof generateCourseOutline> | null>(null)

  // Live Session state
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [sessionForm, setSessionForm] = useState({
    title: '', course_id: '', instructor: '', scheduled_at: '', duration_minutes: 60,
    type: 'webinar' as string, capacity: 50, meeting_url: '',
  })

  // Learning Path state
  const [showPathModal, setShowPathModal] = useState(false)
  const [pathForm, setPathForm] = useState({ title: '', description: '', course_ids: [] as string[], level: 'beginner' as string })

  const tabs = [
    { id: 'catalog', label: t('tabCourseCatalog'), count: courses.length },
    { id: 'enrollments', label: t('tabEnrollments'), count: enrollments.filter(e => e.status !== 'completed').length },
    { id: 'skills', label: t('tabSkillsMatrix') },
    { id: 'builder', label: t('aiBuilder'), count: aiBuilderTemplates.length },
    { id: 'sessions', label: t('liveSessions'), count: liveSessions.filter(s => s.status === 'upcoming').length },
    { id: 'paths', label: t('learningPaths'), count: learningPaths.length },
  ]

  const completedCount = enrollments.filter(e => e.status === 'completed').length
  const inProgressCount = enrollments.filter(e => e.status === 'in_progress').length
  const totalHours = courses.reduce((a, c) => a + c.duration_hours, 0)
  const completionRate = enrollments.length > 0 ? Math.round(completedCount / enrollments.length * 100) : 0

  const skillGaps = useMemo(() => analyzeSkillGaps(courses, enrollments), [courses, enrollments])

  const skillCoverageInsight = useMemo(() => ({
    id: 'ai-skill-coverage',
    category: 'trend' as const,
    severity: 'info' as const,
    title: t('skillCoverageAnalysis'),
    description: t('skillCoverageDesc', { gapCount: skillGaps.length, avgCoverage: skillGaps.length > 0 ? Math.round(skillGaps.reduce((a, g) => a + g.coverage, 0) / skillGaps.length) : 0 }),
    confidence: 'high' as const,
    confidenceScore: 85,
    suggestedAction: t('skillCoverageAction'),
    module: 'learning',
  }), [skillGaps])

  function submitCourse() {
    if (!courseForm.title) return
    addCourse(courseForm)
    setShowCourseModal(false)
    setCourseForm({ title: '', description: '', category: 'Leadership', duration_hours: 8, format: 'online', level: 'beginner', is_mandatory: false })
  }

  function submitEnrollment() {
    if (!enrollForm.employee_id || !enrollForm.course_id) return
    addEnrollment({ employee_id: enrollForm.employee_id, course_id: enrollForm.course_id, status: 'enrolled', progress: 0 })
    setShowEnrollModal(false)
    setEnrollForm({ employee_id: '', course_id: '' })
  }

  function handleEnroll(courseId: string) {
    addEnrollment({ employee_id: currentEmployeeId, course_id: courseId, status: 'enrolled', progress: 0 })
  }

  function handleStartEnrollment(enrollmentId: string) {
    updateEnrollment(enrollmentId, { status: 'in_progress', progress: 10 })
  }

  function handleCompleteEnrollment(enrollmentId: string) {
    updateEnrollment(enrollmentId, { status: 'completed', progress: 100, completed_at: new Date().toISOString() })
  }

  function handleGenerateOutline() {
    if (!builderForm.topic) return
    const outline = generateCourseOutline(builderForm.topic, builderForm.level, builderForm.duration)
    setGeneratedOutline(outline)
  }

  function handleSaveGeneratedCourse() {
    if (!generatedOutline) return
    addCourse({
      title: generatedOutline.title,
      description: generatedOutline.description,
      category: 'AI Generated',
      duration_hours: generatedOutline.total_duration_hours,
      format: 'online',
      level: generatedOutline.level,
      is_mandatory: false,
    })
    setShowBuilderModal(false)
    setGeneratedOutline(null)
    setBuilderForm({ topic: '', level: 'beginner', duration: 8 })
  }

  function submitSession() {
    if (!sessionForm.title || !sessionForm.instructor) return
    addLiveSession({
      ...sessionForm,
      enrolled_count: 0,
      status: 'upcoming',
    })
    setShowSessionModal(false)
    setSessionForm({ title: '', course_id: '', instructor: '', scheduled_at: '', duration_minutes: 60, type: 'webinar', capacity: 50, meeting_url: '' })
  }

  function submitPath() {
    if (!pathForm.title || pathForm.course_ids.length === 0) return
    const selectedCourses = courses.filter(c => pathForm.course_ids.includes(c.id))
    addLearningPath({
      ...pathForm,
      estimated_hours: selectedCourses.reduce((a, c) => a + c.duration_hours, 0),
    })
    setShowPathModal(false)
    setPathForm({ title: '', description: '', course_ids: [], level: 'beginner' })
  }

  function toggleCourseInPath(courseId: string) {
    setPathForm(prev => ({
      ...prev,
      course_ids: prev.course_ids.includes(courseId)
        ? prev.course_ids.filter(id => id !== courseId)
        : [...prev.course_ids, courseId],
    }))
  }

  return (
    <>
      <Header title={t('title')} subtitle={t('subtitle')}
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowEnrollModal(true)}><Plus size={14} /> {t('enrollEmployee')}</Button>
            <Button size="sm" onClick={() => setShowCourseModal(true)}><Plus size={14} /> {t('newCourse')}</Button>
          </div>
        }
      />
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <StatCard label={t('totalCourses')} value={courses.length} icon={<BookOpen size={20} />} />
        <StatCard label={t('inProgress')} value={inProgressCount} change={t('completed', { count: completedCount })} changeType="positive" href="/people" />
        <StatCard label={t('completionRate')} value={`${completionRate}%`} icon={<Award size={20} />} />
        <StatCard label={t('totalHours')} value={totalHours} change={t('availableContent')} changeType="neutral" icon={<Clock size={20} />} />
        <StatCard label={t('liveSessions')} value={liveSessions.filter(s => s.status === 'upcoming').length} icon={<Radio size={20} />} />
        <StatCard label={t('totalPaths')} value={learningPaths.length} icon={<Route size={20} />} />
      </div>

      {/* AI Skill Coverage Insight */}
      <div className="mb-6">
        <AIInsightCard insight={skillCoverageInsight} compact />
      </div>

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} className="mb-6" />

      {activeTab === 'catalog' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map(course => (
            <Card key={course.id}>
              <div className="flex items-start justify-between mb-3">
                <Badge variant={course.is_mandatory ? 'error' : 'default'}>{course.is_mandatory ? t('mandatory') : course.category}</Badge>
                <Badge>{course.level}</Badge>
              </div>
              <h3 className="text-sm font-semibold text-t1 mb-1">{course.title}</h3>
              <p className="text-xs text-t3 mb-3 line-clamp-2">{course.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-t3">
                  <Clock size={12} /> {course.duration_hours}h
                  <span className="capitalize">{course.format}</span>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleEnroll(course.id)}>{t('enroll')}</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'enrollments' && (
        <Card padding="none">
          <CardHeader><CardTitle>{t('allEnrollments')}</CardTitle></CardHeader>
          <div className="divide-y divide-divider">
            {enrollments.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-t3">{t('noEnrollments')}</div>
            ) : enrollments.map(enr => {
              const course = courses.find(c => c.id === enr.course_id)
              const empName = getEmployeeName(enr.employee_id)
              return (
                <div key={enr.id} className="px-6 py-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-tempo-50 flex items-center justify-center text-tempo-600">
                    <GraduationCap size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-t1">{course?.title || t('unknownCourse')}</p>
                    <p className="text-xs text-t3">{empName} - {course?.category}</p>
                  </div>
                  <div className="w-32">
                    <Progress value={enr.progress} showLabel color={enr.status === 'completed' ? 'success' : 'orange'} />
                  </div>
                  <Badge variant={enr.status === 'completed' ? 'success' : enr.status === 'in_progress' ? 'warning' : 'default'}>
                    {enr.status.replace('_', ' ')}
                  </Badge>
                  <div className="flex gap-1">
                    {enr.status === 'enrolled' && (
                      <Button size="sm" variant="primary" onClick={() => handleStartEnrollment(enr.id)}>{tc('start')}</Button>
                    )}
                    {enr.status === 'in_progress' && (
                      <Button size="sm" variant="primary" onClick={() => handleCompleteEnrollment(enr.id)}>{tc('complete')}</Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {activeTab === 'skills' && (() => {
        // Build skills matrix from courses and enrollments
        const categories = [...new Set(courses.map(c => c.category))].filter(Boolean)
        const defaultCategories = ['Leadership', 'Technical', 'Compliance', 'Management', 'Service', 'Technology']
        const allCategories = categories.length > 0 ? categories : defaultCategories
        const skillsData = allCategories.map(cat => {
          const catCourses = courses.filter(c => c.category === cat)
          const catEnrollments = enrollments.filter(e => catCourses.some(c => c.id === e.course_id))
          const completedEnrollments = catEnrollments.filter(e => e.status === 'completed')
          const proficiency = catEnrollments.length > 0
            ? Math.round(catEnrollments.reduce((a, e) => a + e.progress, 0) / catEnrollments.length)
            : 0
          const uniqueEmployees = new Set(catEnrollments.map(e => e.employee_id)).size
          return { skill: cat, proficiency, count: uniqueEmployees, courseCount: catCourses.length }
        })
        // Add skill gap categories that have no courses yet
        const gapCategories = skillGaps.filter(g => !allCategories.includes(g.category))
        gapCategories.forEach(g => {
          skillsData.push({ skill: g.category, proficiency: g.coverage, count: 0, courseCount: 0 })
        })
        return (
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-4">{t('skillsMatrix')}</h3>
            {skillsData.length === 0 ? (
              <div className="text-center py-8 text-sm text-t3">{t('skillsMatrixEmpty')}</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {skillsData.map((item) => (
                  <div key={item.skill} className="bg-canvas rounded-lg p-4">
                    <p className="text-xs font-medium text-t1 mb-2">{item.skill}</p>
                    <Progress value={item.proficiency} showLabel />
                    <p className="text-[0.6rem] text-t3 mt-1">{t('enrolledAcross', { count: item.count, courseCount: item.courseCount })}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )
      })()}

      {/* AI Course Builder Tab */}
      {activeTab === 'builder' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-t1">{t('aiBuilder')}</h3>
              <p className="text-xs text-t3">{t('aiBuilderDescription')}</p>
            </div>
            <Button size="sm" onClick={() => { setGeneratedOutline(null); setShowBuilderModal(true) }}>
              <Sparkles size={14} /> {t('createFromScratch')}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {aiBuilderTemplates.map(tpl => (
              <Card key={tpl.id}>
                <div className="flex items-start justify-between mb-2">
                  <Badge>{tpl.category}</Badge>
                  <Sparkles size={14} className="text-tempo-600" />
                </div>
                <h3 className="text-sm font-semibold text-t1 mb-1">{tpl.title}</h3>
                <p className="text-xs text-t3 mb-3 line-clamp-2">{tpl.description}</p>
                <div className="flex items-center justify-between text-xs text-t3">
                  <span>{tpl.estimated_duration}h - {tpl.module_count} {t('modules')}</span>
                  <Button size="sm" variant="outline" onClick={() => {
                    setBuilderForm({ topic: tpl.title, level: 'intermediate', duration: tpl.estimated_duration })
                    setGeneratedOutline(null)
                    setShowBuilderModal(true)
                  }}>{t('generateCourse')}</Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Live Sessions Tab */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-t1">{t('liveSessions')}</h3>
            <Button size="sm" onClick={() => setShowSessionModal(true)}>
              <Plus size={14} /> {t('scheduleSession')}
            </Button>
          </div>

          {liveSessions.length === 0 ? (
            <Card><div className="text-center py-8 text-sm text-t3">{t('noEnrollments')}</div></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {liveSessions.map(session => {
                const course = courses.find(c => c.id === session.course_id)
                return (
                  <Card key={session.id}>
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant={session.status === 'upcoming' ? 'info' : session.status === 'completed' ? 'default' : 'success'}>
                        {session.status === 'upcoming' ? t('upcoming') : session.status === 'completed' ? tc('completed') : t('liveNow')}
                      </Badge>
                      <Badge>{session.type === 'q_and_a' ? t('qAndA') : session.type === 'workshop' ? t('workshop') : t('webinar')}</Badge>
                    </div>
                    <h3 className="text-sm font-semibold text-t1 mb-1">{session.title}</h3>
                    {course && <p className="text-xs text-t3 mb-2">{course.title}</p>}
                    <div className="space-y-1 text-xs text-t3 mb-3">
                      <div className="flex items-center gap-2"><UsersIcon size={12} /> {t('instructor')}: {session.instructor}</div>
                      <div className="flex items-center gap-2"><Clock size={12} /> {new Date(session.scheduled_at).toLocaleDateString()} - {session.duration_minutes}min</div>
                      <div className="flex items-center gap-2"><Video size={12} /> {t('capacity')}: {session.enrolled_count}/{session.capacity}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Progress value={Math.round((session.enrolled_count / session.capacity) * 100)} className="flex-1 mr-3" />
                      {session.status === 'upcoming' && (
                        <Button size="sm" variant="primary" onClick={() => window.open(session.meeting_url, '_blank')}>
                          {t('joinSession')}
                        </Button>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Learning Paths Tab */}
      {activeTab === 'paths' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-t1">{t('learningPaths')}</h3>
            <Button size="sm" onClick={() => setShowPathModal(true)}>
              <Plus size={14} /> {t('createPath')}
            </Button>
          </div>

          {learningPaths.length === 0 ? (
            <Card><div className="text-center py-8 text-sm text-t3">{t('noEnrollments')}</div></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {learningPaths.map(path => {
                const pathCourses = courses.filter(c => path.course_ids.includes(c.id))
                const pathEnrollments = enrollments.filter(e => path.course_ids.includes(e.course_id))
                const avgProgress = pathEnrollments.length > 0
                  ? Math.round(pathEnrollments.reduce((a, e) => a + e.progress, 0) / pathEnrollments.length)
                  : 0
                return (
                  <Card key={path.id}>
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant={path.level === 'advanced' ? 'error' : path.level === 'intermediate' ? 'warning' : 'default'}>
                        {path.level}
                      </Badge>
                      <Route size={14} className="text-tempo-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-t1 mb-1">{path.title}</h3>
                    <p className="text-xs text-t3 mb-3 line-clamp-2">{path.description}</p>
                    <div className="space-y-2 mb-3">
                      {pathCourses.map(c => (
                        <div key={c.id} className="flex items-center gap-2 text-xs">
                          <BookOpen size={10} className="text-t3" />
                          <span className="text-t2">{c.title}</span>
                          <span className="text-t3 ml-auto">{c.duration_hours}h</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs text-t3 pt-2 border-t border-divider">
                      <span>{t('estimatedHours')}: {path.estimated_hours}h</span>
                      <span>{pathCourses.length} {t('coursesInPath')}</span>
                    </div>
                    {avgProgress > 0 && (
                      <div className="mt-2">
                        <Progress value={avgProgress} showLabel color="orange" />
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* New Course Modal */}
      <Modal open={showCourseModal} onClose={() => setShowCourseModal(false)} title={t('createCourseModal')}>
        <div className="space-y-4">
          <Input label={t('courseTitle')} value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} placeholder={t('courseTitlePlaceholder')} />
          <Textarea label={t('courseDescription')} value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} placeholder={t('courseDescPlaceholder')} rows={3} />
          <div className="grid grid-cols-2 gap-4">
            <Select label={t('categoryLabel')} value={courseForm.category} onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })} options={[
              { value: 'Leadership', label: t('categoryLeadership') },
              { value: 'Technical', label: t('categoryTechnical') },
              { value: 'Compliance', label: t('categoryCompliance') },
              { value: 'Management', label: t('categoryManagement') },
              { value: 'Service', label: t('categoryService') },
              { value: 'Technology', label: t('categoryTechnology') },
            ]} />
            <Input label={t('durationHours')} type="number" value={courseForm.duration_hours} onChange={(e) => setCourseForm({ ...courseForm, duration_hours: Number(e.target.value) })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label={t('format')} value={courseForm.format} onChange={(e) => setCourseForm({ ...courseForm, format: e.target.value as 'online' | 'classroom' | 'blended' })} options={[
              { value: 'online', label: t('formatOnline') },
              { value: 'classroom', label: t('formatClassroom') },
              { value: 'blended', label: t('formatBlended') },
            ]} />
            <Select label={t('level')} value={courseForm.level} onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value as 'beginner' | 'intermediate' | 'advanced' })} options={[
              { value: 'beginner', label: t('levelBeginner') },
              { value: 'intermediate', label: t('levelIntermediate') },
              { value: 'advanced', label: t('levelAdvanced') },
            ]} />
          </div>
          <label className="flex items-center gap-2 text-xs text-t1">
            <input type="checkbox" checked={courseForm.is_mandatory} onChange={(e) => setCourseForm({ ...courseForm, is_mandatory: e.target.checked })} className="rounded border-divider" />
            {t('mandatoryCourse')}
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowCourseModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitCourse}>{t('createCourse')}</Button>
          </div>
        </div>
      </Modal>

      {/* Enroll Employee Modal */}
      <Modal open={showEnrollModal} onClose={() => setShowEnrollModal(false)} title={t('enrollModal')}>
        <div className="space-y-4">
          <Select label={tc('employee')} value={enrollForm.employee_id} onChange={(e) => setEnrollForm({ ...enrollForm, employee_id: e.target.value })} options={[
            { value: '', label: t('selectEmployeePlaceholder') },
            ...employees.map(e => ({ value: e.id, label: e.profile?.full_name || '' })),
          ]} />
          <Select label={t('courseTitle')} value={enrollForm.course_id} onChange={(e) => setEnrollForm({ ...enrollForm, course_id: e.target.value })} options={[
            { value: '', label: t('selectCoursePlaceholder') },
            ...courses.map(c => ({ value: c.id, label: c.title })),
          ]} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowEnrollModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitEnrollment}>{t('enrollButton')}</Button>
          </div>
        </div>
      </Modal>

      {/* AI Course Builder Modal */}
      <Modal open={showBuilderModal} onClose={() => setShowBuilderModal(false)} title={t('aiBuilder')} size="lg">
        <div className="space-y-4">
          {!generatedOutline ? (
            <>
              <Input label={t('topic')} value={builderForm.topic} onChange={(e) => setBuilderForm({ ...builderForm, topic: e.target.value })} placeholder="e.g. Project Management, Data Analysis..." />
              <div className="grid grid-cols-2 gap-4">
                <Select label={t('level')} value={builderForm.level} onChange={(e) => setBuilderForm({ ...builderForm, level: e.target.value })} options={[
                  { value: 'beginner', label: t('levelBeginner') },
                  { value: 'intermediate', label: t('levelIntermediate') },
                  { value: 'advanced', label: t('levelAdvanced') },
                ]} />
                <Input label={t('duration') + ' (hours)'} type="number" min={1} max={100} value={builderForm.duration} onChange={(e) => setBuilderForm({ ...builderForm, duration: Number(e.target.value) })} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setShowBuilderModal(false)}>{tc('cancel')}</Button>
                <Button onClick={handleGenerateOutline}><Sparkles size={14} /> {t('generateOutline')}</Button>
              </div>
            </>
          ) : (
            <>
              <div className="bg-canvas rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={16} className="text-tempo-600" />
                  <h4 className="text-sm font-semibold text-t1">{generatedOutline.title}</h4>
                </div>
                <p className="text-xs text-t3 mb-4">{generatedOutline.description}</p>
                <div className="space-y-3">
                  {generatedOutline.modules.map((mod, i) => (
                    <div key={i} className="bg-surface rounded-lg p-3">
                      <p className="text-xs font-medium text-t1 mb-1">{mod.title}</p>
                      <p className="text-[0.6rem] text-t3 mb-2">{mod.duration_minutes} min</p>
                      <div className="space-y-1">
                        {mod.lessons.map((lesson, j) => (
                          <div key={j} className="text-[0.6rem] text-t2 flex items-center gap-1">
                            <span className="w-4 h-4 rounded-full bg-tempo-100 text-tempo-600 flex items-center justify-center text-[0.5rem]">{j + 1}</span>
                            {lesson}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setGeneratedOutline(null)}>{tc('back')}</Button>
                <Button onClick={handleSaveGeneratedCourse}><Zap size={14} /> {t('saveAsCourse')}</Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Schedule Live Session Modal */}
      <Modal open={showSessionModal} onClose={() => setShowSessionModal(false)} title={t('scheduleSession')}>
        <div className="space-y-4">
          <Input label={t('courseTitle')} value={sessionForm.title} onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })} placeholder="Session title..." />
          <Select label={t('courseTitle')} value={sessionForm.course_id} onChange={(e) => setSessionForm({ ...sessionForm, course_id: e.target.value })} options={[
            { value: '', label: '-- Select Course --' },
            ...courses.map(c => ({ value: c.id, label: c.title })),
          ]} />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('instructor')} value={sessionForm.instructor} onChange={(e) => setSessionForm({ ...sessionForm, instructor: e.target.value })} />
            <Input label={tc('date')} type="datetime-local" value={sessionForm.scheduled_at} onChange={(e) => setSessionForm({ ...sessionForm, scheduled_at: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Select label={t('sessionType')} value={sessionForm.type} onChange={(e) => setSessionForm({ ...sessionForm, type: e.target.value })} options={[
              { value: 'webinar', label: t('webinar') },
              { value: 'workshop', label: t('workshop') },
              { value: 'q_and_a', label: t('qAndA') },
            ]} />
            <Input label={t('duration') + ' (min)'} type="number" value={sessionForm.duration_minutes} onChange={(e) => setSessionForm({ ...sessionForm, duration_minutes: Number(e.target.value) })} />
            <Input label={t('capacity')} type="number" value={sessionForm.capacity} onChange={(e) => setSessionForm({ ...sessionForm, capacity: Number(e.target.value) })} />
          </div>
          <Input label={t('meetingUrl')} value={sessionForm.meeting_url} onChange={(e) => setSessionForm({ ...sessionForm, meeting_url: e.target.value })} placeholder="https://meet.tempo.com/..." />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowSessionModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitSession}>{t('scheduleSession')}</Button>
          </div>
        </div>
      </Modal>

      {/* Create Learning Path Modal */}
      <Modal open={showPathModal} onClose={() => setShowPathModal(false)} title={t('createPath')} size="lg">
        <div className="space-y-4">
          <Input label={t('courseTitle')} value={pathForm.title} onChange={(e) => setPathForm({ ...pathForm, title: e.target.value })} placeholder="Path name..." />
          <Textarea label={t('courseDescription')} value={pathForm.description} onChange={(e) => setPathForm({ ...pathForm, description: e.target.value })} rows={2} placeholder="Describe this learning path..." />
          <Select label={t('level')} value={pathForm.level} onChange={(e) => setPathForm({ ...pathForm, level: e.target.value })} options={[
            { value: 'beginner', label: t('levelBeginner') },
            { value: 'intermediate', label: t('levelIntermediate') },
            { value: 'advanced', label: t('levelAdvanced') },
          ]} />
          <div>
            <p className="text-xs font-medium text-t1 mb-2">{t('courseSequence')}</p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {courses.map(c => (
                <label key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-canvas cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pathForm.course_ids.includes(c.id)}
                    onChange={() => toggleCourseInPath(c.id)}
                    className="rounded border-divider"
                  />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-t1">{c.title}</p>
                    <p className="text-[0.6rem] text-t3">{c.category} - {c.duration_hours}h - {c.level}</p>
                  </div>
                </label>
              ))}
            </div>
            {pathForm.course_ids.length > 0 && (
              <p className="text-xs text-t3 mt-2">
                {pathForm.course_ids.length} {t('coursesInPath')} - {t('estimatedHours')}: {courses.filter(c => pathForm.course_ids.includes(c.id)).reduce((a, c) => a + c.duration_hours, 0)}h
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowPathModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitPath}>{t('createPath')}</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
