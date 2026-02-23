import { describe, it, expect } from 'vitest'
import {
  demoOrg, demoDepartments, demoEmployees, demoGoals,
  demoReviews, demoCompBands, demoCourses, demoSurveys,
  demoProjects, demoTasks, demoMilestones,
  demoStrategicObjectives, demoKeyResults, demoInitiatives,
  demoKPIDefinitions, demoKPIMeasurements,
  demoWorkflows, demoWorkflowSteps, demoWorkflowRuns, demoWorkflowTemplates,
} from '../demo-data'

describe('Demo Data Integrity', () => {
  describe('Core entities', () => {
    it('org has required fields', () => {
      expect(demoOrg.id).toBeTruthy()
      expect(demoOrg.name).toBeTruthy()
      expect(demoOrg.slug).toBeTruthy()
    })

    it('all departments reference valid org', () => {
      for (const dept of demoDepartments) {
        expect(dept.org_id).toBe(demoOrg.id)
        expect(dept.id).toBeTruthy()
        expect(dept.name).toBeTruthy()
      }
    })

    it('all employees reference valid org and department', () => {
      const deptIds = new Set(demoDepartments.map(d => d.id))
      for (const emp of demoEmployees) {
        expect(emp.org_id).toBe(demoOrg.id)
        expect(emp.id).toBeTruthy()
        expect(emp.profile.full_name).toBeTruthy()
        expect(emp.profile.email).toBeTruthy()
        if (emp.department_id) {
          expect(deptIds.has(emp.department_id)).toBe(true)
        }
      }
    })

    it('all goals reference valid employees', () => {
      const empIds = new Set(demoEmployees.map(e => e.id))
      for (const goal of demoGoals) {
        expect(goal.org_id).toBe(demoOrg.id)
        expect(empIds.has(goal.employee_id)).toBe(true)
      }
    })
  })

  describe('Phase 3: Project Management', () => {
    it('all projects reference valid org', () => {
      for (const proj of demoProjects) {
        expect(proj.org_id).toBe(demoOrg.id)
        expect(proj.title).toBeTruthy()
      }
    })

    it('all milestones reference valid projects', () => {
      const projIds = new Set(demoProjects.map(p => p.id))
      for (const mile of demoMilestones) {
        expect(projIds.has(mile.project_id)).toBe(true)
      }
    })

    it('all tasks reference valid projects', () => {
      const projIds = new Set(demoProjects.map(p => p.id))
      for (const task of demoTasks) {
        expect(projIds.has(task.project_id)).toBe(true)
        expect(task.title).toBeTruthy()
      }
    })

    it('task assignees reference valid employees', () => {
      const empIds = new Set(demoEmployees.map(e => e.id))
      for (const task of demoTasks) {
        if (task.assignee_id) {
          expect(empIds.has(task.assignee_id)).toBe(true)
        }
      }
    })
  })

  describe('Phase 3: Strategy Execution', () => {
    it('all objectives reference valid org', () => {
      for (const obj of demoStrategicObjectives) {
        expect(obj.org_id).toBe(demoOrg.id)
        expect(obj.title).toBeTruthy()
      }
    })

    it('all key results reference valid objectives', () => {
      const objIds = new Set(demoStrategicObjectives.map(o => o.id))
      for (const kr of demoKeyResults) {
        expect(objIds.has(kr.objective_id)).toBe(true)
        expect(kr.target_value).toBeGreaterThan(0)
      }
    })

    it('all KPI measurements reference valid KPIs', () => {
      const kpiIds = new Set(demoKPIDefinitions.map(k => k.id))
      for (const m of demoKPIMeasurements) {
        expect(kpiIds.has(m.kpi_id)).toBe(true)
      }
    })
  })

  describe('Phase 3: Workflow Studio', () => {
    it('all workflows reference valid org', () => {
      for (const wf of demoWorkflows) {
        expect(wf.org_id).toBe(demoOrg.id)
        expect(wf.title).toBeTruthy()
      }
    })

    it('all workflow steps reference valid workflows', () => {
      const wfIds = new Set(demoWorkflows.map(w => w.id))
      for (const step of demoWorkflowSteps) {
        expect(wfIds.has(step.workflow_id)).toBe(true)
      }
    })

    it('all workflow runs reference valid workflows', () => {
      const wfIds = new Set(demoWorkflows.map(w => w.id))
      for (const run of demoWorkflowRuns) {
        expect(wfIds.has(run.workflow_id)).toBe(true)
      }
    })

    it('all workflow templates reference valid org', () => {
      for (const tmpl of demoWorkflowTemplates) {
        expect(tmpl.org_id).toBe(demoOrg.id)
      }
    })
  })

  describe('ID prefix conventions', () => {
    it('projects use proj- prefix', () => {
      for (const p of demoProjects) expect(p.id.startsWith('proj-')).toBe(true)
    })
    it('milestones use mile- prefix', () => {
      for (const m of demoMilestones) expect(m.id.startsWith('mile-')).toBe(true)
    })
    it('tasks use task- prefix', () => {
      for (const t of demoTasks) expect(t.id.startsWith('task-')).toBe(true)
    })
    it('objectives use obj- prefix', () => {
      for (const o of demoStrategicObjectives) expect(o.id.startsWith('obj-')).toBe(true)
    })
    it('key results use kr- prefix', () => {
      for (const kr of demoKeyResults) expect(kr.id.startsWith('kr-')).toBe(true)
    })
    it('KPIs use kpi- prefix', () => {
      for (const k of demoKPIDefinitions) expect(k.id.startsWith('kpi-')).toBe(true)
    })
    it('workflows use wf- prefix', () => {
      for (const w of demoWorkflows) expect(w.id.startsWith('wf-')).toBe(true)
    })
  })

  describe('No duplicate IDs', () => {
    it('projects have unique IDs', () => {
      const ids = demoProjects.map(p => p.id)
      expect(new Set(ids).size).toBe(ids.length)
    })
    it('tasks have unique IDs', () => {
      const ids = demoTasks.map(t => t.id)
      expect(new Set(ids).size).toBe(ids.length)
    })
    it('objectives have unique IDs', () => {
      const ids = demoStrategicObjectives.map(o => o.id)
      expect(new Set(ids).size).toBe(ids.length)
    })
    it('workflows have unique IDs', () => {
      const ids = demoWorkflows.map(w => w.id)
      expect(new Set(ids).size).toBe(ids.length)
    })
    it('employees have unique IDs', () => {
      const ids = demoEmployees.map(e => e.id)
      expect(new Set(ids).size).toBe(ids.length)
    })
    it('employees have unique emails', () => {
      const emails = demoEmployees.map(e => e.profile.email)
      expect(new Set(emails).size).toBe(emails.length)
    })
  })
})
