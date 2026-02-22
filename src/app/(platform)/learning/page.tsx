'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Progress } from '@/components/ui/progress'
import { Tabs } from '@/components/ui/tabs'
import { GraduationCap, BookOpen, Award, Plus, Clock } from 'lucide-react'
import { demoCourses, demoEnrollments, demoEmployees } from '@/lib/demo-data'

export default function LearningPage() {
  const [activeTab, setActiveTab] = useState('catalog')
  const tabs = [
    { id: 'catalog', label: 'Course Catalog', count: demoCourses.length },
    { id: 'my-learning', label: 'My Learning', count: demoEnrollments.filter(e => e.status !== 'completed').length },
    { id: 'skills', label: 'Skills Matrix' },
  ]

  const completedCount = demoEnrollments.filter(e => e.status === 'completed').length
  const inProgressCount = demoEnrollments.filter(e => e.status === 'in_progress').length
  const totalHours = demoCourses.reduce((a, c) => a + c.duration_hours, 0)

  return (
    <>
      <Header title="Learning" subtitle="Courses, learning paths, and skills development" actions={<Button size="sm"><Plus size={14} /> New Course</Button>} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Courses" value={demoCourses.length} icon={<BookOpen size={20} />} />
        <StatCard label="In Progress" value={inProgressCount} change={`${completedCount} completed`} changeType="positive" />
        <StatCard label="Completion Rate" value={`${Math.round(completedCount / demoEnrollments.length * 100)}%`} icon={<Award size={20} />} />
        <StatCard label="Total Hours" value={totalHours} change="Available content" changeType="neutral" icon={<Clock size={20} />} />
      </div>
      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} className="mb-6" />

      {activeTab === 'catalog' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {demoCourses.map(course => (
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
                <Button size="sm" variant="outline">Enroll</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'my-learning' && (
        <Card padding="none">
          <CardHeader><CardTitle>My Enrollments</CardTitle></CardHeader>
          <div className="divide-y divide-divider">
            {demoEnrollments.map(enr => {
              const course = demoCourses.find(c => c.id === enr.course_id)
              const emp = demoEmployees.find(e => e.id === enr.employee_id)
              return (
                <div key={enr.id} className="px-6 py-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-tempo-50 flex items-center justify-center text-tempo-600">
                    <GraduationCap size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-t1">{course?.title}</p>
                    <p className="text-xs text-t3">{emp?.profile?.full_name} - {course?.category}</p>
                  </div>
                  <div className="w-32">
                    <Progress value={enr.progress} showLabel color={enr.status === 'completed' ? 'success' : 'orange'} />
                  </div>
                  <Badge variant={enr.status === 'completed' ? 'success' : enr.status === 'in_progress' ? 'warning' : 'default'}>
                    {enr.status.replace('_', ' ')}
                  </Badge>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {activeTab === 'skills' && (
        <Card>
          <h3 className="text-sm font-semibold text-t1 mb-4">Skills Matrix</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Leadership', 'Technical', 'Communication', 'Problem Solving', 'Analytics', 'Project Management', 'Customer Service', 'Risk Management'].map((skill) => (
              <div key={skill} className="bg-canvas rounded-lg p-4">
                <p className="text-xs font-medium text-t1 mb-2">{skill}</p>
                <Progress value={70} showLabel />
                <p className="text-[0.6rem] text-t3 mt-1">150+ employees proficient</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  )
}
