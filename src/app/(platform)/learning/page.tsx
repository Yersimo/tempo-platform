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
import { GraduationCap, BookOpen, Award, Plus, Clock } from 'lucide-react'
import { useTempo } from '@/lib/store'
import { AIInsightCard, AIScoreBadge } from '@/components/ai'
import { analyzeSkillGaps, predictCourseCompletion } from '@/lib/ai-engine'

export default function LearningPage() {
  const { courses, enrollments, employees, addCourse, addEnrollment, updateEnrollment, getEmployeeName, currentEmployeeId } = useTempo()
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

  const tabs = [
    { id: 'catalog', label: 'Course Catalog', count: courses.length },
    { id: 'enrollments', label: 'Enrollments', count: enrollments.filter(e => e.status !== 'completed').length },
    { id: 'skills', label: 'Skills Matrix' },
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
    title: 'Skill Coverage Analysis',
    description: `${skillGaps.length} categories tracked, ${skillGaps.length > 0 ? Math.round(skillGaps.reduce((a, g) => a + g.coverage, 0) / skillGaps.length) : 0}% average coverage across all skill areas.`,
    confidence: 'high' as const,
    confidenceScore: 85,
    suggestedAction: 'Review gaps in underperforming categories',
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

  return (
    <>
      <Header title="Learning" subtitle="Courses, learning paths, and skills development"
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowEnrollModal(true)}><Plus size={14} /> Enroll Employee</Button>
            <Button size="sm" onClick={() => setShowCourseModal(true)}><Plus size={14} /> New Course</Button>
          </div>
        }
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Courses" value={courses.length} icon={<BookOpen size={20} />} />
        <StatCard label="In Progress" value={inProgressCount} change={`${completedCount} completed`} changeType="positive" />
        <StatCard label="Completion Rate" value={`${completionRate}%`} icon={<Award size={20} />} />
        <StatCard label="Total Hours" value={totalHours} change="Available content" changeType="neutral" icon={<Clock size={20} />} />
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
                <Badge variant={course.is_mandatory ? 'error' : 'default'}>{course.is_mandatory ? 'Mandatory' : course.category}</Badge>
                <Badge>{course.level}</Badge>
              </div>
              <h3 className="text-sm font-semibold text-t1 mb-1">{course.title}</h3>
              <p className="text-xs text-t3 mb-3 line-clamp-2">{course.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-t3">
                  <Clock size={12} /> {course.duration_hours}h
                  <span className="capitalize">{course.format}</span>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleEnroll(course.id)}>Enroll</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'enrollments' && (
        <Card padding="none">
          <CardHeader><CardTitle>All Enrollments</CardTitle></CardHeader>
          <div className="divide-y divide-divider">
            {enrollments.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-t3">No enrollments yet. Enroll in a course to get started.</div>
            ) : enrollments.map(enr => {
              const course = courses.find(c => c.id === enr.course_id)
              const empName = getEmployeeName(enr.employee_id)
              return (
                <div key={enr.id} className="px-6 py-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-tempo-50 flex items-center justify-center text-tempo-600">
                    <GraduationCap size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-t1">{course?.title || 'Unknown Course'}</p>
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
                      <Button size="sm" variant="primary" onClick={() => handleStartEnrollment(enr.id)}>Start</Button>
                    )}
                    {enr.status === 'in_progress' && (
                      <Button size="sm" variant="primary" onClick={() => handleCompleteEnrollment(enr.id)}>Complete</Button>
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
            <h3 className="text-sm font-semibold text-t1 mb-4">Skills Matrix</h3>
            {skillsData.length === 0 ? (
              <div className="text-center py-8 text-sm text-t3">Add courses and enroll employees to build the skills matrix.</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {skillsData.map((item) => (
                  <div key={item.skill} className="bg-canvas rounded-lg p-4">
                    <p className="text-xs font-medium text-t1 mb-2">{item.skill}</p>
                    <Progress value={item.proficiency} showLabel />
                    <p className="text-[0.6rem] text-t3 mt-1">{item.count} employees enrolled across {item.courseCount} courses</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )
      })()}

      {/* New Course Modal */}
      <Modal open={showCourseModal} onClose={() => setShowCourseModal(false)} title="Create New Course">
        <div className="space-y-4">
          <Input label="Course Title" value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} placeholder="e.g. Leadership Essentials" />
          <Textarea label="Description" value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} placeholder="Course overview and learning objectives..." rows={3} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Category" value={courseForm.category} onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })} options={[
              { value: 'Leadership', label: 'Leadership' },
              { value: 'Technical', label: 'Technical' },
              { value: 'Compliance', label: 'Compliance' },
              { value: 'Management', label: 'Management' },
              { value: 'Service', label: 'Service' },
              { value: 'Technology', label: 'Technology' },
            ]} />
            <Input label="Duration (hours)" type="number" value={courseForm.duration_hours} onChange={(e) => setCourseForm({ ...courseForm, duration_hours: Number(e.target.value) })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Format" value={courseForm.format} onChange={(e) => setCourseForm({ ...courseForm, format: e.target.value as 'online' | 'classroom' | 'blended' })} options={[
              { value: 'online', label: 'Online' },
              { value: 'classroom', label: 'Classroom' },
              { value: 'blended', label: 'Blended' },
            ]} />
            <Select label="Level" value={courseForm.level} onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value as 'beginner' | 'intermediate' | 'advanced' })} options={[
              { value: 'beginner', label: 'Beginner' },
              { value: 'intermediate', label: 'Intermediate' },
              { value: 'advanced', label: 'Advanced' },
            ]} />
          </div>
          <label className="flex items-center gap-2 text-xs text-t1">
            <input type="checkbox" checked={courseForm.is_mandatory} onChange={(e) => setCourseForm({ ...courseForm, is_mandatory: e.target.checked })} className="rounded border-divider" />
            Mandatory course
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowCourseModal(false)}>Cancel</Button>
            <Button onClick={submitCourse}>Create Course</Button>
          </div>
        </div>
      </Modal>

      {/* Enroll Employee Modal */}
      <Modal open={showEnrollModal} onClose={() => setShowEnrollModal(false)} title="Enroll Employee in Course">
        <div className="space-y-4">
          <Select label="Employee" value={enrollForm.employee_id} onChange={(e) => setEnrollForm({ ...enrollForm, employee_id: e.target.value })} options={[
            { value: '', label: 'Select employee...' },
            ...employees.map(e => ({ value: e.id, label: e.profile?.full_name || '' })),
          ]} />
          <Select label="Course" value={enrollForm.course_id} onChange={(e) => setEnrollForm({ ...enrollForm, course_id: e.target.value })} options={[
            { value: '', label: 'Select course...' },
            ...courses.map(c => ({ value: c.id, label: c.title })),
          ]} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowEnrollModal(false)}>Cancel</Button>
            <Button onClick={submitEnrollment}>Enroll</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
