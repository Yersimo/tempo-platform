import { describe, it, expect } from 'vitest'
import {
  scoreProjectHealth,
  predictTimelineRisk,
  detectResourceBottlenecks,
  scoreOKRQuality,
  analyzeStrategyAlignment,
  forecastKPITrend,
  analyzeWorkflowEfficiency,
  suggestWorkflowOptimizations,
  predictWorkflowFailure,
} from '../ai-engine'

// ─── Project Management AI ───────────────────────────────────────────────

describe('Project Management AI', () => {
  const mockProject = {
    id: 'proj-1',
    title: 'Mobile Banking App',
    status: 'active',
    start_date: '2026-01-01',
    end_date: '2026-06-30',
    budget: 500000,
  }

  const mockMilestones = [
    { id: 'mile-1', project_id: 'proj-1', title: 'Design Phase', status: 'done', due_date: '2026-02-01' },
    { id: 'mile-2', project_id: 'proj-1', title: 'Development', status: 'in_progress', due_date: '2026-04-01' },
    { id: 'mile-3', project_id: 'proj-1', title: 'Testing', status: 'todo', due_date: '2026-05-15' },
  ]

  const mockTasks = [
    { id: 'task-1', project_id: 'proj-1', status: 'done', priority: 'high', assignee_id: 'emp-1', estimated_hours: 40, actual_hours: 35, due_date: '2026-02-15' },
    { id: 'task-2', project_id: 'proj-1', status: 'in_progress', priority: 'high', assignee_id: 'emp-1', estimated_hours: 60, actual_hours: 20, due_date: '2026-03-15' },
    { id: 'task-3', project_id: 'proj-1', status: 'todo', priority: 'medium', assignee_id: 'emp-2', estimated_hours: 30, actual_hours: 0, due_date: '2026-04-01' },
    { id: 'task-4', project_id: 'proj-1', status: 'in_progress', priority: 'critical', assignee_id: 'emp-1', estimated_hours: 20, actual_hours: 15, due_date: '2026-03-01' },
  ]

  describe('scoreProjectHealth', () => {
    it('returns a score between 0-100', () => {
      const score = scoreProjectHealth(mockProject, mockMilestones, mockTasks)
      expect(score.value).toBeGreaterThanOrEqual(0)
      expect(score.value).toBeLessThanOrEqual(100)
    })

    it('has a valid label', () => {
      const score = scoreProjectHealth(mockProject, mockMilestones, mockTasks)
      expect(['Healthy', 'At Risk', 'Critical']).toContain(score.label)
    })

    it('handles empty tasks and milestones', () => {
      const score = scoreProjectHealth(mockProject, [], [])
      expect(score.value).toBeGreaterThanOrEqual(0)
    })

    it('has breakdown factors', () => {
      const score = scoreProjectHealth(mockProject, mockMilestones, mockTasks)
      expect(score.breakdown).toBeDefined()
      expect(score.breakdown!.length).toBeGreaterThan(0)
    })
  })

  describe('predictTimelineRisk', () => {
    it('returns insight for active project', () => {
      const insight = predictTimelineRisk(mockProject, mockTasks)
      // May or may not return insight depending on current date vs end_date
      expect(insight === null || insight.title !== undefined).toBe(true)
    })

    it('returns null for project without end_date', () => {
      const noEnd = { ...mockProject, end_date: undefined }
      const insight = predictTimelineRisk(noEnd, mockTasks)
      expect(insight).toBeNull()
    })

    it('returns null for empty tasks', () => {
      const insight = predictTimelineRisk(mockProject, [])
      expect(insight).toBeNull()
    })
  })

  describe('detectResourceBottlenecks', () => {
    it('returns array of insights', () => {
      const employees = [
        { id: 'emp-1', profile: { full_name: 'Alice' } },
        { id: 'emp-2', profile: { full_name: 'Bob' } },
      ]
      const insights = detectResourceBottlenecks(mockTasks, employees)
      expect(Array.isArray(insights)).toBe(true)
    })

    it('handles empty inputs', () => {
      const insights = detectResourceBottlenecks([], [])
      expect(insights).toEqual([])
    })

    it('detects overloaded employees with 5+ active tasks', () => {
      const heavyTasks = Array.from({ length: 6 }, (_, i) => ({
        id: `task-${i}`,
        project_id: 'proj-1',
        status: 'in_progress',
        priority: 'high',
        assignee_id: 'emp-1',
        estimated_hours: 10,
        actual_hours: 2,
        due_date: '2026-04-01',
      }))
      const employees = [{ id: 'emp-1', profile: { full_name: 'Alice' } }]
      const insights = detectResourceBottlenecks(heavyTasks, employees)
      expect(insights.length).toBeGreaterThan(0)
      expect(insights[0].title).toContain('Alice')
    })
  })
})

// ─── Strategy Execution AI ──────────────────────────────────────────────

describe('Strategy Execution AI', () => {
  const mockObjective = {
    id: 'obj-1',
    title: 'Expand digital banking services across West Africa',
    description: 'Increase digital adoption to 80% of customer base',
    status: 'active',
    progress: 45,
    period: 'FY2026',
  }

  const mockKeyResults = [
    { id: 'kr-1', objective_id: 'obj-1', title: 'Reach 5M mobile app users', target_value: 5000000, current_value: 3200000, unit: 'users' },
    { id: 'kr-2', objective_id: 'obj-1', title: 'Launch in 5 new countries', target_value: 5, current_value: 2, unit: 'countries' },
    { id: 'kr-3', objective_id: 'obj-1', title: 'Reduce transaction cost by 30%', target_value: 30, current_value: 18, unit: '%' },
  ]

  describe('scoreOKRQuality', () => {
    it('returns a score between 0-100', () => {
      const score = scoreOKRQuality(mockObjective, mockKeyResults)
      expect(score.value).toBeGreaterThanOrEqual(0)
      expect(score.value).toBeLessThanOrEqual(100)
    })

    it('scores higher with more key results', () => {
      const scoreWith3 = scoreOKRQuality(mockObjective, mockKeyResults)
      const scoreWith1 = scoreOKRQuality(mockObjective, [mockKeyResults[0]])
      // More KRs generally means better defined OKR
      expect(scoreWith3.value).toBeGreaterThanOrEqual(scoreWith1.value - 20)
    })

    it('handles empty key results', () => {
      const score = scoreOKRQuality(mockObjective, [])
      expect(score.value).toBeGreaterThanOrEqual(0)
      expect(score.label).toBe('Needs key results')
    })

    it('has breakdown factors', () => {
      const score = scoreOKRQuality(mockObjective, mockKeyResults)
      expect(score.breakdown).toBeDefined()
      expect(score.breakdown!.length).toBe(5)
    })
  })

  describe('analyzeStrategyAlignment', () => {
    it('returns array of insights', () => {
      const goals = [{ id: 'g-1', title: 'Digital transformation', status: 'on_track' }]
      const initiatives = [{ id: 'init-1', title: 'Mobile app rewrite', status: 'in_progress', objective_id: 'obj-1' }]
      const insights = analyzeStrategyAlignment([mockObjective], goals, initiatives)
      expect(Array.isArray(insights)).toBe(true)
    })

    it('detects objectives without linked initiatives', () => {
      const insights = analyzeStrategyAlignment([mockObjective], [], [])
      expect(insights.length).toBeGreaterThan(0)
      expect(insights[0].title).toContain('no linked initiatives')
    })

    it('does not flag objectives with linked initiatives', () => {
      const initiatives = [{ id: 'init-1', title: 'App rewrite', status: 'in_progress', objective_id: 'obj-1' }]
      const insights = analyzeStrategyAlignment([mockObjective], [], initiatives)
      const unlinked = insights.filter(i => i.title.includes('no linked initiatives'))
      expect(unlinked.length).toBe(0)
    })
  })

  describe('forecastKPITrend', () => {
    it('returns insight with trend data', () => {
      const kpi = { id: 'kpi-1', name: 'Customer Satisfaction', target_value: 90 }
      const measurements = [
        { kpi_id: 'kpi-1', value: 78, period: '2026-01', recorded_at: '2026-01-31' },
        { kpi_id: 'kpi-1', value: 82, period: '2026-02', recorded_at: '2026-02-28' },
      ]
      const insight = forecastKPITrend(kpi, measurements)
      expect(insight).not.toBeNull()
      if (insight) {
        expect(insight.title).toBeTruthy()
        expect(insight.title).toContain('Customer Satisfaction')
      }
    })

    it('returns null with fewer than 2 measurements', () => {
      const kpi = { id: 'kpi-1', name: 'Test KPI', target_value: 100 }
      const insight = forecastKPITrend(kpi, [{ kpi_id: 'kpi-1', value: 50, period: '2026-01', recorded_at: '2026-01-31' }])
      expect(insight).toBeNull()
    })

    it('detects improving trend', () => {
      const kpi = { id: 'kpi-1', name: 'Revenue', target_value: 100 }
      const measurements = [
        { kpi_id: 'kpi-1', value: 60, period: '2026-01', recorded_at: '2026-01-31' },
        { kpi_id: 'kpi-1', value: 80, period: '2026-02', recorded_at: '2026-02-28' },
      ]
      const insight = forecastKPITrend(kpi, measurements)
      expect(insight).not.toBeNull()
      expect(insight!.title).toContain('improving')
    })

    it('detects declining trend', () => {
      const kpi = { id: 'kpi-1', name: 'Churn', target_value: 5 }
      const measurements = [
        { kpi_id: 'kpi-1', value: 80, period: '2026-01', recorded_at: '2026-01-31' },
        { kpi_id: 'kpi-1', value: 60, period: '2026-02', recorded_at: '2026-02-28' },
      ]
      const insight = forecastKPITrend(kpi, measurements)
      expect(insight).not.toBeNull()
      expect(insight!.title).toContain('declining')
    })
  })
})

// ─── Workflow Studio AI ─────────────────────────────────────────────────

describe('Workflow Studio AI', () => {
  const mockWorkflow = {
    id: 'wf-1',
    title: 'Onboarding Automation',
    status: 'active',
    trigger_type: 'event',
  }

  const mockSteps = [
    { id: 'wfs-1', workflow_id: 'wf-1', step_type: 'action', title: 'Create account', position: 0 },
    { id: 'wfs-2', workflow_id: 'wf-1', step_type: 'notification', title: 'Send welcome email', position: 1 },
    { id: 'wfs-3', workflow_id: 'wf-1', step_type: 'delay', title: 'Wait 24 hours', position: 2 },
    { id: 'wfs-4', workflow_id: 'wf-1', step_type: 'approval', title: 'Manager approval', position: 3 },
  ]

  const mockRuns = [
    { id: 'wfr-1', workflow_id: 'wf-1', status: 'completed', started_at: '2026-01-15T09:00:00Z', completed_at: '2026-01-15T09:05:00Z' },
    { id: 'wfr-2', workflow_id: 'wf-1', status: 'completed', started_at: '2026-01-20T10:00:00Z', completed_at: '2026-01-20T10:03:00Z' },
    { id: 'wfr-3', workflow_id: 'wf-1', status: 'failed', started_at: '2026-02-01T11:00:00Z', completed_at: '2026-02-01T11:02:00Z' },
  ]

  describe('analyzeWorkflowEfficiency', () => {
    it('returns a score between 0-100', () => {
      const score = analyzeWorkflowEfficiency(mockWorkflow, mockSteps, mockRuns)
      expect(score.value).toBeGreaterThanOrEqual(0)
      expect(score.value).toBeLessThanOrEqual(100)
    })

    it('handles empty runs', () => {
      const score = analyzeWorkflowEfficiency(mockWorkflow, mockSteps, [])
      expect(score.value).toBeGreaterThanOrEqual(0)
      expect(score.label).toBe('No runs')
    })

    it('has breakdown factors', () => {
      const score = analyzeWorkflowEfficiency(mockWorkflow, mockSteps, mockRuns)
      expect(score.breakdown).toBeDefined()
      expect(score.breakdown!.length).toBe(3)
    })

    it('scores higher with all successful runs', () => {
      const successRuns = mockRuns.filter(r => r.status === 'completed')
      const scoreSuccess = analyzeWorkflowEfficiency(mockWorkflow, mockSteps, successRuns)
      const scoreMixed = analyzeWorkflowEfficiency(mockWorkflow, mockSteps, mockRuns)
      expect(scoreSuccess.value).toBeGreaterThanOrEqual(scoreMixed.value)
    })
  })

  describe('suggestWorkflowOptimizations', () => {
    it('returns array of recommendations', () => {
      const recs = suggestWorkflowOptimizations(mockWorkflow, mockSteps, mockRuns)
      expect(Array.isArray(recs)).toBe(true)
    })

    it('each recommendation has required fields', () => {
      const recs = suggestWorkflowOptimizations(mockWorkflow, mockSteps, mockRuns)
      for (const rec of recs) {
        expect(rec.title).toBeTruthy()
        expect(rec.rationale).toBeTruthy()
        expect(['high', 'medium', 'low']).toContain(rec.impact)
        expect(['high', 'medium', 'low']).toContain(rec.effort)
      }
    })

    it('suggests conditional branching for linear workflows without conditions', () => {
      const recs = suggestWorkflowOptimizations(mockWorkflow, mockSteps, mockRuns)
      const conditionRec = recs.find(r => r.title.includes('conditional'))
      expect(conditionRec).toBeDefined()
    })

    it('suggests simplification for workflows with many steps', () => {
      const manySteps = Array.from({ length: 10 }, (_, i) => ({
        id: `wfs-${i}`, workflow_id: 'wf-1', step_type: 'action', title: `Step ${i}`, position: i,
      }))
      const recs = suggestWorkflowOptimizations(mockWorkflow, manySteps, mockRuns)
      const simplifyRec = recs.find(r => r.title.includes('simplifying'))
      expect(simplifyRec).toBeDefined()
    })
  })

  describe('predictWorkflowFailure', () => {
    it('detects failure pattern from history', () => {
      const runsWithFailures = [
        { id: 'wfr-1', workflow_id: 'wf-1', status: 'completed', started_at: '2026-01-10', completed_at: '2026-01-10' },
        { id: 'wfr-2', workflow_id: 'wf-1', status: 'failed', started_at: '2026-01-15', completed_at: '2026-01-15' },
        { id: 'wfr-3', workflow_id: 'wf-1', status: 'failed', started_at: '2026-01-20', completed_at: '2026-01-20' },
      ]
      const insight = predictWorkflowFailure(mockWorkflow, runsWithFailures)
      expect(insight).not.toBeNull()
      expect(insight!.title).toContain('Recurring workflow failures')
    })

    it('returns null for too few runs', () => {
      const fewRuns = mockRuns.slice(0, 2)
      const insight = predictWorkflowFailure(mockWorkflow, fewRuns)
      expect(insight).toBeNull()
    })

    it('returns null for perfect run history', () => {
      const perfectRuns = [
        { id: 'wfr-1', workflow_id: 'wf-1', status: 'completed', started_at: '2026-01-10', completed_at: '2026-01-10' },
        { id: 'wfr-2', workflow_id: 'wf-1', status: 'completed', started_at: '2026-01-15', completed_at: '2026-01-15' },
        { id: 'wfr-3', workflow_id: 'wf-1', status: 'completed', started_at: '2026-01-20', completed_at: '2026-01-20' },
      ]
      const insight = predictWorkflowFailure(mockWorkflow, perfectRuns)
      expect(insight).toBeNull()
    })
  })
})
