/**
 * Engagement → Performance Integration
 *
 * When engagement survey results are available:
 * - Aggregate team sentiment scores by department
 * - Map low engagement to performance review flags
 * - Create manager action items for disengaged teams
 *
 * All integrations are event-driven via the cross-module event bus.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Department engagement summary */
export interface DepartmentEngagement {
  departmentId: string
  departmentName: string
  averageScore: number // 0-100
  responseCount: number
  sentiment: 'high' | 'moderate' | 'low' | 'critical'
  trend: 'improving' | 'stable' | 'declining' | 'unknown'
}

/** Performance review flag generated from engagement data */
export interface EngagementPerformanceFlag {
  departmentId: string
  departmentName: string
  flagType: 'low_engagement' | 'critical_engagement' | 'declining_trend'
  severity: 'warning' | 'critical'
  score: number
  message: string
}

/** Manager action item generated from engagement data */
export interface EngagementActionItem {
  id: string
  departmentId: string
  departmentName: string
  managerId?: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  dueDate: string
  category: 'team_meeting' | 'one_on_one' | 'process_improvement' | 'recognition' | 'training'
}

/** Result of mapping engagement to performance */
export interface EngagementPerformanceResult {
  surveyId: string
  surveyTitle: string
  departmentSummaries: DepartmentEngagement[]
  performanceFlags: EngagementPerformanceFlag[]
  actionItems: EngagementActionItem[]
  overallScore: number
  departmentsAtRisk: number
}

/** Store slice needed for engagement→performance operations */
export interface EngagementPerformanceStoreSlice {
  employees: Array<{ id: string; department_id?: string; role?: string; profile?: { full_name: string } }>
  departments: Array<{ id: string; name: string }>
  surveys: Array<Record<string, unknown>>
  surveyResponses: Array<Record<string, unknown>>
  engagementScores: Array<Record<string, unknown>>
  addActionPlan?: (data: Record<string, unknown>) => void
  addToast?: (toast: { type: string; title: string; description?: string }) => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ENGAGEMENT_THRESHOLDS = {
  high: 75,
  moderate: 55,
  low: 35,
  // Below 35 = critical
}

// ---------------------------------------------------------------------------
// Core Functions
// ---------------------------------------------------------------------------

/**
 * Map engagement survey results to performance flags and action items.
 *
 * @param surveyId        - ID of the completed survey
 * @param surveyTitle     - Title of the survey
 * @param store           - Store slice with survey and employee data
 * @returns Result with department summaries, flags, and action items
 */
export function mapEngagementToPerformance(
  surveyId: string,
  surveyTitle: string,
  store: EngagementPerformanceStoreSlice,
): EngagementPerformanceResult {
  // Get survey responses for this survey
  const responses = store.surveyResponses.filter(
    r => (r as Record<string, unknown>).survey_id === surveyId,
  )

  // Group responses by department
  const deptScores = new Map<string, { total: number; count: number }>()
  for (const response of responses) {
    const r = response as Record<string, unknown>
    const employeeId = r.employee_id as string
    const score = typeof r.score === 'number' ? r.score : (typeof r.overall_score === 'number' ? r.overall_score : null)

    if (!score || !employeeId) continue

    const employee = store.employees.find(e => e.id === employeeId)
    const deptId = employee?.department_id || 'unknown'

    const existing = deptScores.get(deptId) || { total: 0, count: 0 }
    existing.total += score
    existing.count += 1
    deptScores.set(deptId, existing)
  }

  // If no response data, use engagement scores directly
  if (deptScores.size === 0) {
    for (const score of store.engagementScores) {
      const s = score as Record<string, unknown>
      const deptId = (s.department_id as string) || 'unknown'
      const value = typeof s.score === 'number' ? s.score : (typeof s.average_score === 'number' ? s.average_score : 50)

      const existing = deptScores.get(deptId) || { total: 0, count: 0 }
      existing.total += value
      existing.count += 1
      deptScores.set(deptId, existing)
    }
  }

  // Build department summaries
  const departmentSummaries: DepartmentEngagement[] = []
  const performanceFlags: EngagementPerformanceFlag[] = []
  const actionItems: EngagementActionItem[] = []

  let overallTotal = 0
  let overallCount = 0
  let departmentsAtRisk = 0
  const now = new Date()

  for (const [deptId, data] of deptScores) {
    const avgScore = Math.round(data.total / data.count)
    const dept = store.departments.find(d => d.id === deptId)
    const deptName = dept?.name || 'Unknown Department'

    overallTotal += data.total
    overallCount += data.count

    // Determine sentiment
    let sentiment: DepartmentEngagement['sentiment']
    if (avgScore >= ENGAGEMENT_THRESHOLDS.high) sentiment = 'high'
    else if (avgScore >= ENGAGEMENT_THRESHOLDS.moderate) sentiment = 'moderate'
    else if (avgScore >= ENGAGEMENT_THRESHOLDS.low) sentiment = 'low'
    else sentiment = 'critical'

    departmentSummaries.push({
      departmentId: deptId,
      departmentName: deptName,
      averageScore: avgScore,
      responseCount: data.count,
      sentiment,
      trend: 'unknown', // Would need historical data for trend
    })

    // Generate performance flags for low/critical engagement
    if (sentiment === 'low' || sentiment === 'critical') {
      departmentsAtRisk++

      performanceFlags.push({
        departmentId: deptId,
        departmentName: deptName,
        flagType: sentiment === 'critical' ? 'critical_engagement' : 'low_engagement',
        severity: sentiment === 'critical' ? 'critical' : 'warning',
        score: avgScore,
        message: sentiment === 'critical'
          ? `${deptName} has critically low engagement (${avgScore}/100). Immediate attention required.`
          : `${deptName} has below-average engagement (${avgScore}/100). Recommend proactive follow-up.`,
      })

      // Generate action items for managers of at-risk departments
      const dueDate = new Date(now)
      dueDate.setDate(dueDate.getDate() + (sentiment === 'critical' ? 7 : 14))
      const dueDateStr = dueDate.toISOString().split('T')[0]

      actionItems.push({
        id: `ea-${surveyId}-${deptId}-meeting`,
        departmentId: deptId,
        departmentName: deptName,
        title: `Hold team listening session — ${deptName}`,
        description: `Engagement score for ${deptName} is ${avgScore}/100. Schedule a team meeting to discuss concerns and gather feedback.`,
        priority: sentiment === 'critical' ? 'high' : 'medium',
        dueDate: dueDateStr,
        category: 'team_meeting',
      })

      if (sentiment === 'critical') {
        actionItems.push({
          id: `ea-${surveyId}-${deptId}-1on1`,
          departmentId: deptId,
          departmentName: deptName,
          title: `Conduct 1-on-1s with ${deptName} team members`,
          description: `Critical engagement alert. Schedule individual check-ins with all team members to understand root causes.`,
          priority: 'high',
          dueDate: dueDateStr,
          category: 'one_on_one',
        })
      }
    }
  }

  const overallScore = overallCount > 0 ? Math.round(overallTotal / overallCount) : 0

  return {
    surveyId,
    surveyTitle,
    departmentSummaries,
    performanceFlags,
    actionItems,
    overallScore,
    departmentsAtRisk,
  }
}

/**
 * Generate engagement alerts from survey results.
 * Creates toast notifications and action plans for critical departments.
 *
 * @param result - Output from mapEngagementToPerformance
 * @param store  - Store actions for persisting
 * @returns Number of action items created
 */
export function generateEngagementAlerts(
  result: EngagementPerformanceResult,
  store: EngagementPerformanceStoreSlice,
): number {
  let created = 0

  for (const item of result.actionItems) {
    if (store.addActionPlan) {
      store.addActionPlan({
        title: item.title,
        description: item.description,
        department_id: item.departmentId,
        priority: item.priority,
        due_date: item.dueDate,
        category: item.category,
        status: 'pending',
        source: 'engagement-performance-integration',
        survey_id: result.surveyId,
        auto_generated: true,
      })
      created++
    }
  }

  return created
}
