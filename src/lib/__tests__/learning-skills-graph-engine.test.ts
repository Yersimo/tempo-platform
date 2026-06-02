import { describe, expect, it } from 'vitest'
import {
  buildLearningSkillsGraph,
  recommendLearningForEmployee,
} from '../learning-skills-graph-engine'

const skills = [
  { id: 'sk-lead', name: 'Team Leadership', category: 'leadership', is_core: true },
  { id: 'sk-strategy', name: 'Strategic Thinking', category: 'leadership' },
  { id: 'sk-comm', name: 'Communication', category: 'behavioral', is_core: true },
  { id: 'sk-compliance', name: 'AML Compliance', category: 'compliance', is_core: true },
]

const employeeSkills = [
  { employee_id: 'emp-2', skill_id: 'sk-lead', current_level: 2, target_level: 4 },
  { employee_id: 'emp-2', skill_id: 'sk-strategy', current_level: 1, target_level: 3 },
  { employee_id: 'emp-2', skill_id: 'sk-comm', current_level: 4, target_level: 4 },
]

const roleRequirements = [
  { job_title: 'Engineering Manager', level: 'L6', skill_id: 'sk-lead', required_level: 4, importance: 'required' },
  { job_title: 'Engineering Manager', level: 'L6', skill_id: 'sk-strategy', required_level: 3, importance: 'preferred' },
  { job_title: 'Engineering Manager', level: 'L6', skill_id: 'sk-comm', required_level: 4, importance: 'required' },
  { job_title: 'Senior Engineer', level: 'L5', skill_id: 'sk-comm', required_level: 3, importance: 'required' },
]

const courses = [
  { id: 'course-leadership', title: 'Leadership Essentials', description: 'Lead and coach teams', category: 'Leadership', duration_hours: 12 },
  { id: 'course-strategy', title: 'Strategic Thinking for Managers', description: 'Business strategy and operating plans', category: 'Leadership', duration_hours: 8 },
  { id: 'course-aml', title: 'AML Compliance Annual', description: 'Mandatory banking compliance training', category: 'Compliance', duration_hours: 2, is_mandatory: true },
  { id: 'course-comms', title: 'Executive Communication', description: 'Communication for senior managers', category: 'Behavioral', duration_hours: 6 },
]

const learningPaths = [
  { id: 'path-manager', title: 'New Manager Essentials', course_ids: ['course-leadership', 'course-strategy', 'course-comms'], estimated_hours: 26 },
  { id: 'path-compliance', title: 'Compliance Mastery', course_ids: ['course-aml'], estimated_hours: 2 },
]

describe('learning skills graph engine', () => {
  it('builds a catalog coverage graph from skills, courses, and paths', () => {
    const graph = buildLearningSkillsGraph({ skills, courses, learningPaths })

    expect(graph.skillCount).toBe(4)
    expect(graph.courseCount).toBe(4)
    expect(graph.pathCount).toBe(2)
    expect(graph.coverageScore).toBe(100)
    expect(graph.skillCoverage.find(skill => skill.skillId === 'sk-lead')?.courseIds).toContain('course-leadership')
    expect(graph.skillCoverage.find(skill => skill.skillId === 'sk-compliance')?.pathIds).toContain('path-compliance')
  })

  it('scores role readiness and identifies required skill gaps', () => {
    const plan = recommendLearningForEmployee({
      skills,
      employeeSkills,
      roleRequirements,
      courses,
      learningPaths,
      enrollments: [],
      employeeId: 'emp-2',
      targetRole: { jobTitle: 'Engineering Manager', level: 'L6' },
    })

    expect(plan.requiredSkillCount).toBe(3)
    expect(plan.coveredSkillCount).toBe(1)
    expect(plan.readinessScore).toBe(64)
    expect(plan.gaps).toEqual(expect.arrayContaining([
      expect.objectContaining({ skillId: 'sk-lead', gap: 2, priority: 'critical' }),
      expect.objectContaining({ skillId: 'sk-strategy', gap: 2, priority: 'high' }),
    ]))
    expect(plan.strengths).toEqual([expect.objectContaining({ skillId: 'sk-comm' })])
  })

  it('recommends courses and paths that match gaps while avoiding completed courses', () => {
    const plan = recommendLearningForEmployee({
      skills,
      employeeSkills,
      roleRequirements,
      courses,
      learningPaths,
      enrollments: [
        { employee_id: 'emp-2', course_id: 'course-strategy', status: 'completed', progress: 100 },
        { employee_id: 'emp-2', course_id: 'course-leadership', status: 'in_progress', progress: 40 },
      ],
      employeeId: 'emp-2',
      targetRole: { jobTitle: 'Engineering Manager', level: 'L6' },
    })

    expect(plan.recommendedCourses.map(course => course.id)).toContain('course-leadership')
    expect(plan.recommendedCourses.map(course => course.id)).not.toContain('course-strategy')
    expect(plan.recommendedCourses.find(course => course.id === 'course-leadership')?.reason).toContain('Continue active enrollment')
    expect(plan.recommendedPaths.map(path => path.id)).toContain('path-manager')
  })

  it('flags mandatory learning that is not complete', () => {
    const plan = recommendLearningForEmployee({
      skills,
      employeeSkills,
      roleRequirements,
      courses,
      learningPaths,
      enrollments: [{ employee_id: 'emp-2', course_id: 'course-aml', status: 'enrolled', progress: 10 }],
      employeeId: 'emp-2',
      targetRole: { jobTitle: 'Engineering Manager', level: 'L6' },
    })

    expect(plan.complianceNeeds).toEqual([
      expect.objectContaining({
        courseId: 'course-aml',
        status: 'enrolled',
        reason: 'Mandatory course is started but not complete.',
      }),
    ])
    expect(plan.safeNextActions[2]).toContain('Resolve 1 mandatory learning item')
  })

  it('handles camelCase records and infers the target role from the employee', () => {
    const plan = recommendLearningForEmployee({
      skills: [{ id: 'sk-data', name: 'Data Analysis', category: 'functional' }],
      employeeSkills: [{ employeeId: 'emp-9', skillId: 'sk-data', currentLevel: 1 }],
      roleRequirements: [{ jobTitle: 'Finance Analyst', level: 'L4', skillId: 'sk-data', requiredLevel: 3, importance: 'required' }],
      courses: [{ id: 'course-data', title: 'Data Analysis for Finance', durationHours: 5 }],
      learningPaths: [{ id: 'path-data', title: 'Analyst Ramp', courseIds: ['course-data'] }],
      enrollments: [],
      employee: { id: 'emp-9', jobTitle: 'Finance Analyst', level: 'L4' },
    })

    expect(plan.employeeId).toBe('emp-9')
    expect(plan.targetRole).toEqual({ jobTitle: 'Finance Analyst', level: 'L4' })
    expect(plan.gaps).toEqual([expect.objectContaining({ skillId: 'sk-data', gap: 2, priority: 'critical' })])
    expect(plan.recommendedCourses).toEqual([expect.objectContaining({ id: 'course-data' })])
  })
})
