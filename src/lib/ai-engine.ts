/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Tempo AI Engine - Deterministic intelligence layer
 * Pure functions analyzing store data, returning typed insights.
 * All client-side. No API calls. Works on 3G.
 */

// ---- Types ----

export type ConfidenceLevel = 'high' | 'medium' | 'low'
export type InsightSeverity = 'critical' | 'warning' | 'info' | 'positive'
export type InsightCategory = 'anomaly' | 'recommendation' | 'prediction' | 'score' | 'trend' | 'alert' | 'narrative'

export interface AIInsight {
  id: string
  category: InsightCategory
  severity: InsightSeverity
  title: string
  description: string
  confidence: ConfidenceLevel
  confidenceScore: number
  suggestedAction?: string
  actionLabel?: string
  module: string
  dataPoints?: Record<string, number | string>
}

export interface AIScore {
  value: number
  label: string
  breakdown?: Array<{ factor: string; score: number; weight: number }>
  trend?: 'up' | 'down' | 'stable'
}

export interface AIAnomaly {
  id: string
  metric: string
  currentValue: number
  expectedValue: number
  deviationPercent: number
  severity: InsightSeverity
  explanation: string
}

export interface AINarrative {
  summary: string
  bulletPoints: string[]
}

export interface AIRecommendation {
  id: string
  title: string
  rationale: string
  impact: 'high' | 'medium' | 'low'
  effort: 'low' | 'medium' | 'high'
  category: string
}

// ---- Utility Helpers ----

function genAIId(prefix: string) {
  return `ai-${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0
  const m = mean(values)
  return Math.sqrt(values.reduce((sum, v) => sum + (v - m) ** 2, 0) / values.length)
}

function pct(part: number, total: number): number {
  if (total === 0) return 0
  return Math.round((part / total) * 100)
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

function toConfidence(score: number): ConfidenceLevel {
  if (score >= 75) return 'high'
  if (score >= 50) return 'medium'
  return 'low'
}

function daysBetween(a: string, b: string): number {
  return Math.abs(new Date(a).getTime() - new Date(b).getTime()) / 86400000
}

// ---- SMART Goal Quality Scoring ----

export function scoreGoalQuality(goal: { title: string; description?: string; target_value?: number; due_date?: string; progress?: number }): AIScore {
  const factors: Array<{ factor: string; score: number; weight: number }> = []

  // Specific: title length + keyword density
  const titleLen = (goal.title || '').length
  const specificity = clamp(titleLen > 10 ? (titleLen > 30 ? 90 : 60 + titleLen) : titleLen * 4, 0, 100)
  factors.push({ factor: 'Specific', score: specificity, weight: 0.25 })

  // Measurable: has numbers, percentages, or target value
  const hasNumbers = /\d+/.test(goal.title + (goal.description || ''))
  const hasTarget = (goal.target_value || 0) > 0
  const measurability = hasTarget ? 95 : hasNumbers ? 70 : 25
  factors.push({ factor: 'Measurable', score: measurability, weight: 0.25 })

  // Achievable: reasonable scope (not too vague)
  const descLen = (goal.description || '').length
  const achievability = descLen > 20 ? 85 : descLen > 5 ? 60 : 40
  factors.push({ factor: 'Achievable', score: achievability, weight: 0.15 })

  // Relevant: action keywords
  const actionWords = ['increase', 'reduce', 'improve', 'achieve', 'deliver', 'complete', 'launch', 'implement', 'grow', 'develop']
  const hasAction = actionWords.some(w => (goal.title + ' ' + (goal.description || '')).toLowerCase().includes(w))
  const relevance = hasAction ? 90 : 50
  factors.push({ factor: 'Relevant', score: relevance, weight: 0.15 })

  // Time-bound: has deadline
  const timeBound = goal.due_date ? 95 : 20
  factors.push({ factor: 'Time-bound', score: timeBound, weight: 0.2 })

  const total = Math.round(factors.reduce((sum, f) => sum + f.score * f.weight, 0))

  return {
    value: total,
    label: total >= 80 ? 'Strong' : total >= 60 ? 'Moderate' : 'Needs improvement',
    breakdown: factors,
    trend: 'stable',
  }
}

// ---- Performance Analyzers ----

export function detectRatingBias(reviews: any[], employees: any[]): AIInsight[] {
  const insights: AIInsight[] = []
  if (reviews.length < 3) return insights

  // Group reviews by reviewer
  const byReviewer: Record<string, number[]> = {}
  reviews.forEach(r => {
    if (r.reviewer_id && r.overall_rating) {
      if (!byReviewer[r.reviewer_id]) byReviewer[r.reviewer_id] = []
      byReviewer[r.reviewer_id].push(r.overall_rating)
    }
  })

  for (const [reviewerId, ratings] of Object.entries(byReviewer)) {
    if (ratings.length < 2) continue
    const avg = mean(ratings)
    const sd = stdDev(ratings)

    // Central tendency: low variance
    if (sd < 0.3 && ratings.length >= 3) {
      const reviewer = employees.find((e: any) => e.id === reviewerId)
      const name = reviewer?.profile?.full_name || 'A manager'
      insights.push({
        id: genAIId('bias-central'),
        category: 'alert',
        severity: 'warning',
        title: 'Central Tendency Detected',
        description: `${name}'s ratings show low variance (avg ${avg.toFixed(1)}, ${ratings.length} reviews). Consider calibration session.`,
        confidence: 'medium',
        confidenceScore: 68,
        suggestedAction: 'Review rating distribution in calibration',
        module: 'performance',
      })
    }

    // Leniency bias
    if (avg > 4.3 && ratings.length >= 2) {
      const reviewer = employees.find((e: any) => e.id === reviewerId)
      const name = reviewer?.profile?.full_name || 'A manager'
      insights.push({
        id: genAIId('bias-lenient'),
        category: 'alert',
        severity: 'info',
        title: 'Leniency Pattern',
        description: `${name} rates above average (${avg.toFixed(1)}/5). ${pct(ratings.filter(r => r >= 4).length, ratings.length)}% of ratings are 4+.`,
        confidence: 'medium',
        confidenceScore: 62,
        module: 'performance',
      })
    }
  }

  return insights
}

export function predictPerformanceTrend(goal: any): AIInsight | null {
  if (!goal) return null
  const progress = goal.progress || 0
  const status = goal.status || 'on_track'
  const dueDate = goal.due_date

  if (!dueDate) return null

  const daysLeft = daysBetween(new Date().toISOString(), dueDate)
  const expectedProgress = daysLeft <= 0 ? 100 : Math.max(0, 100 - (daysLeft / 90) * 100)
  const gap = expectedProgress - progress

  if (gap > 25 && status !== 'behind') {
    return {
      id: genAIId('perf-trend'),
      category: 'prediction',
      severity: 'warning',
      title: 'At Risk Next Quarter',
      description: `Progress is ${progress}% with ${Math.round(daysLeft)} days remaining. At current pace, this goal may fall behind.`,
      confidence: gap > 40 ? 'high' : 'medium',
      confidenceScore: clamp(50 + gap, 0, 95),
      suggestedAction: 'Schedule check-in to address blockers',
      module: 'performance',
    }
  }
  return null
}

export function analyzeFeedbackSentiment(feedbackItems: any[]): { positive: number; negative: number; neutral: number } {
  const positive_words = ['excellent', 'great', 'outstanding', 'impressive', 'strong', 'fantastic', 'brilliant', 'exceptional', 'superb', 'amazing', 'dedicated', 'committed', 'reliable', 'proactive', 'innovative']
  const negative_words = ['poor', 'weak', 'lacking', 'needs improvement', 'disappointing', 'inconsistent', 'late', 'missed', 'below', 'struggle', 'concern', 'issue', 'problem', 'challenge', 'difficult']

  let pos = 0, neg = 0, neu = 0
  feedbackItems.forEach(f => {
    const text = ((f.content || '') + ' ' + (f.message || '')).toLowerCase()
    const posCount = positive_words.filter(w => text.includes(w)).length
    const negCount = negative_words.filter(w => text.includes(w)).length
    if (posCount > negCount) pos++
    else if (negCount > posCount) neg++
    else neu++
  })
  const total = feedbackItems.length || 1
  return { positive: pct(pos, total), negative: pct(neg, total), neutral: pct(neu, total) }
}

// ---- Compensation Analyzers ----

export function detectPayEquityGaps(employees: any[], compBands: any[]): AIInsight[] {
  const insights: AIInsight[] = []
  if (employees.length < 5) return insights

  // Group by level and compare
  const byLevel: Record<string, any[]> = {}
  employees.forEach(e => {
    const level = e.level || 'unknown'
    if (!byLevel[level]) byLevel[level] = []
    byLevel[level].push(e)
  })

  for (const [level, emps] of Object.entries(byLevel)) {
    if (emps.length < 3) continue
    const salaries = emps.map((e: any) => e.base_salary || 0).filter((s: number) => s > 0)
    if (salaries.length < 2) continue

    const avg = mean(salaries)
    const sd = stdDev(salaries)
    const cv = sd / avg // coefficient of variation

    if (cv > 0.15) {
      insights.push({
        id: genAIId('equity-gap'),
        category: 'anomaly',
        severity: 'warning',
        title: `Pay Variance in ${level}`,
        description: `Salary spread is ${(cv * 100).toFixed(0)}% within ${level} (${emps.length} employees). Range: $${Math.min(...salaries).toLocaleString()} - $${Math.max(...salaries).toLocaleString()}.`,
        confidence: 'medium',
        confidenceScore: 72,
        suggestedAction: 'Review compensation bands for this level',
        module: 'compensation',
      })
    }
  }

  // Check for below-band employees
  compBands.forEach((band: any) => {
    const bandEmps = employees.filter((e: any) => e.level === band.level && e.job_title?.includes(band.role))
    const belowMin = bandEmps.filter((e: any) => (e.base_salary || 0) < (band.min || 0))
    if (belowMin.length > 0) {
      insights.push({
        id: genAIId('below-band'),
        category: 'alert',
        severity: 'critical',
        title: `${belowMin.length} Below Band Minimum`,
        description: `${belowMin.length} employee(s) in ${band.role} ${band.level} are below the minimum of $${(band.min || 0).toLocaleString()}.`,
        confidence: 'high',
        confidenceScore: 95,
        suggestedAction: 'Initiate salary adjustment proposals',
        module: 'compensation',
      })
    }
  })

  return insights
}

export function detectCompAnomalies(salaryReviews: any[], compBands: any[]): AIAnomaly[] {
  const anomalies: AIAnomaly[] = []

  salaryReviews.forEach(sr => {
    if (!sr.proposed_salary || !sr.current_salary) return
    const increase = ((sr.proposed_salary - sr.current_salary) / sr.current_salary) * 100

    if (increase > 20) {
      anomalies.push({
        id: genAIId('comp-anomaly'),
        metric: 'Salary Increase',
        currentValue: sr.current_salary,
        expectedValue: sr.current_salary * 1.1,
        deviationPercent: increase,
        severity: increase > 30 ? 'critical' : 'warning',
        explanation: `${increase.toFixed(1)}% increase proposed ($${sr.current_salary.toLocaleString()} to $${sr.proposed_salary.toLocaleString()}). Typical range is 5-15%.`,
      })
    }
  })

  return anomalies
}

export function modelBudgetImpact(salaryReviews: any[]): { totalAnnualImpact: number; avgIncrease: number; count: number } {
  const pending = salaryReviews.filter(sr => sr.status === 'pending_approval' || sr.status === 'pending')
  const increases = pending.map(sr => (sr.proposed_salary || 0) - (sr.current_salary || 0)).filter(d => d > 0)
  return {
    totalAnnualImpact: increases.reduce((a, b) => a + b, 0),
    avgIncrease: increases.length > 0 ? mean(increases) : 0,
    count: increases.length,
  }
}

// ---- Engagement Analyzers ----

export function calculateFlightRisk(employee: any, data: {
  reviews: any[], goals: any[], engagementScores: any[],
  salaryReviews: any[], mentoringPairs: any[], leaveRequests: any[]
}): AIScore {
  const factors: Array<{ factor: string; score: number; weight: number }> = []

  // Review rating (lower = higher risk)
  const empReviews = data.reviews.filter(r => r.employee_id === employee.id)
  const avgRating = empReviews.length > 0 ? mean(empReviews.map(r => r.overall_rating || 3)) : 3
  const ratingRisk = avgRating >= 4.5 ? 70 : avgRating >= 3.5 ? 30 : 15 // high performers more at risk of leaving
  factors.push({ factor: 'High Performer Risk', score: ratingRisk, weight: 0.2 })

  // Comp ratio (below market = higher risk)
  const compRisk = employee.comp_ratio ? (employee.comp_ratio < 0.9 ? 85 : employee.comp_ratio < 1.0 ? 50 : 20) : 50
  factors.push({ factor: 'Below Market Comp', score: compRisk, weight: 0.25 })

  // Goal progress (stalled = higher risk)
  const empGoals = data.goals.filter(g => g.employee_id === employee.id)
  const avgProgress = empGoals.length > 0 ? mean(empGoals.map(g => g.progress || 0)) : 50
  const goalRisk = avgProgress < 30 ? 70 : avgProgress < 60 ? 40 : 15
  factors.push({ factor: 'Stalled Goals', score: goalRisk, weight: 0.15 })

  // Has mentor (no mentor = higher risk)
  const hasMentor = data.mentoringPairs.some(p => p.mentee_id === employee.id && p.status === 'active')
  factors.push({ factor: 'No Active Mentor', score: hasMentor ? 10 : 60, weight: 0.15 })

  // Tenure factor (2-3 years is highest risk)
  const tenureYears = employee.hire_date ? daysBetween(employee.hire_date, new Date().toISOString()) / 365 : 2
  const tenureRisk = tenureYears >= 2 && tenureYears <= 4 ? 65 : tenureYears < 1 ? 30 : 35
  factors.push({ factor: 'Tenure Risk Window', score: tenureRisk, weight: 0.1 })

  // Leave pattern (excessive sick leave)
  const sickLeaves = data.leaveRequests.filter(lr => lr.employee_id === employee.id && lr.type === 'sick').length
  factors.push({ factor: 'Leave Patterns', score: sickLeaves >= 3 ? 70 : sickLeaves >= 1 ? 40 : 15, weight: 0.15 })

  const total = Math.round(factors.reduce((sum, f) => sum + f.score * f.weight, 0))

  return {
    value: clamp(total, 0, 100),
    label: total >= 70 ? 'High Risk' : total >= 45 ? 'Moderate Risk' : 'Low Risk',
    breakdown: factors,
    trend: avgRating >= 4 && compRisk > 60 ? 'up' : 'stable',
  }
}

export function identifyEngagementDrivers(engagementScores: any[]): AIInsight[] {
  if (engagementScores.length < 2) return []
  const insights: AIInsight[] = []

  const sorted = [...engagementScores].sort((a, b) => (b.overall_score || 0) - (a.overall_score || 0))
  const top = sorted[0]
  const bottom = sorted[sorted.length - 1]

  if (top && bottom && (top.overall_score - bottom.overall_score) > 10) {
    insights.push({
      id: genAIId('eng-driver'),
      category: 'trend',
      severity: 'info',
      title: 'Engagement Disparity',
      description: `Highest engagement: ${top.department_id || 'Dept'} (${top.overall_score}/100). Lowest: ${bottom.department_id || 'Dept'} (${bottom.overall_score}/100). Gap of ${top.overall_score - bottom.overall_score} points.`,
      confidence: 'high',
      confidenceScore: 82,
      suggestedAction: 'Investigate drivers in low-engagement department',
      module: 'engagement',
    })
  }

  const avgENPS = mean(engagementScores.map(e => e.enps || 0))
  if (avgENPS < 20) {
    insights.push({
      id: genAIId('eng-enps'),
      category: 'alert',
      severity: 'warning',
      title: 'eNPS Below Benchmark',
      description: `Organization eNPS is ${avgENPS.toFixed(0)}, below the industry benchmark of 30. Focus on manager effectiveness and career development.`,
      confidence: 'medium',
      confidenceScore: 70,
      suggestedAction: 'Launch targeted pulse survey',
      module: 'engagement',
    })
  }

  return insights
}

// ---- Learning Analyzers ----

export function recommendCourses(employee: any, goals: any[], courses: any[], enrollments: any[]): AIRecommendation[] {
  const enrolled = new Set(enrollments.filter(e => e.employee_id === employee.id).map(e => e.course_id))
  const available = courses.filter(c => !enrolled.has(c.id))

  const recs: AIRecommendation[] = []
  const goalText = goals.filter(g => g.employee_id === employee.id).map(g => (g.title + ' ' + (g.description || '')).toLowerCase()).join(' ')

  available.forEach(course => {
    const courseText = (course.title + ' ' + (course.description || '')).toLowerCase()
    // Simple keyword matching
    const keywords = courseText.split(/\s+/).filter((w: string) => w.length > 4)
    const matches = keywords.filter((w: string) => goalText.includes(w)).length
    const relevance = matches > 0 ? clamp(40 + matches * 15, 0, 95) : course.is_mandatory ? 80 : 20

    if (relevance > 40 || course.is_mandatory) {
      recs.push({
        id: genAIId('course-rec'),
        title: course.title,
        rationale: course.is_mandatory ? 'Mandatory course for all employees' : `Aligns with ${matches} keyword(s) in your active goals`,
        impact: relevance > 70 ? 'high' : relevance > 50 ? 'medium' : 'low',
        effort: (course.duration_hours || 8) > 16 ? 'high' : (course.duration_hours || 8) > 8 ? 'medium' : 'low',
        category: 'learning',
      })
    }
  })

  return recs.sort((a, b) => {
    const impactOrder = { high: 3, medium: 2, low: 1 }
    return (impactOrder[b.impact] || 0) - (impactOrder[a.impact] || 0)
  }).slice(0, 3)
}

export function analyzeSkillGaps(courses: any[], enrollments: any[]): Array<{ category: string; coverage: number; enrolled: number; completed: number }> {
  const categories = [...new Set(courses.map(c => c.category))]
  return categories.map(cat => {
    const catCourses = courses.filter(c => c.category === cat)
    const catEnrollments = enrollments.filter(e => catCourses.some(c => c.id === e.course_id))
    const completed = catEnrollments.filter(e => e.status === 'completed').length
    return {
      category: cat,
      coverage: catEnrollments.length > 0 ? pct(completed, catEnrollments.length) : 0,
      enrolled: catEnrollments.length,
      completed,
    }
  })
}

export function predictCourseCompletion(enrollment: any): AIScore {
  const progress = enrollment.progress || 0
  const status = enrollment.status

  if (status === 'completed') return { value: 100, label: 'Completed' }

  // Simple: project based on current progress and typical patterns
  const likelihood = status === 'in_progress' ? clamp(progress + 25, 0, 95) : 55
  return {
    value: likelihood,
    label: likelihood >= 75 ? 'Likely' : likelihood >= 50 ? 'Possible' : 'At Risk',
    trend: progress > 50 ? 'up' : 'stable',
  }
}

// ---- Mentoring Analyzers ----

export function calculateMentorMatch(mentor: any, mentee: any, employees: any[]): AIScore {
  const factors: Array<{ factor: string; score: number; weight: number }> = []

  // Seniority gap (2-3 levels ideal)
  const levels = ['junior', 'mid', 'senior', 'lead', 'principal', 'director', 'vp', 'c-suite']
  const mentorIdx = levels.indexOf((mentor.level || '').toLowerCase())
  const menteeIdx = levels.indexOf((mentee.level || '').toLowerCase())
  const gap = mentorIdx - menteeIdx
  const seniorityScore = gap >= 1 && gap <= 3 ? 90 : gap > 3 ? 50 : gap === 0 ? 30 : 60
  factors.push({ factor: 'Seniority Gap', score: seniorityScore, weight: 0.3 })

  // Cross-department (diversity bonus)
  const crossDept = mentor.department_id !== mentee.department_id ? 80 : 50
  factors.push({ factor: 'Cross-Department', score: crossDept, weight: 0.2 })

  // Cross-country (diversity bonus)
  const crossCountry = mentor.country !== mentee.country ? 85 : 50
  factors.push({ factor: 'Cross-Country', score: crossCountry, weight: 0.2 })

  // Different but complementary (different roles)
  const diffRole = mentor.job_title !== mentee.job_title ? 75 : 40
  factors.push({ factor: 'Complementary Roles', score: diffRole, weight: 0.3 })

  const total = Math.round(factors.reduce((sum, f) => sum + f.score * f.weight, 0))
  return {
    value: clamp(total, 0, 100),
    label: total >= 80 ? 'Excellent Match' : total >= 60 ? 'Good Match' : 'Fair Match',
    breakdown: factors,
  }
}

// ---- Recruiting Analyzers ----

export function scoreCandidateFit(application: any, job: any): AIScore {
  const factors: Array<{ factor: string; score: number; weight: number }> = []

  // Manual rating weight
  const ratingScore = ((application.rating || 3) / 5) * 100
  factors.push({ factor: 'Interviewer Rating', score: ratingScore, weight: 0.35 })

  // Stage progression (further = stronger)
  const stages = ['applied', 'screening', 'interview', 'assessment', 'offer', 'hired']
  const stageIdx = stages.indexOf(application.stage || application.status || 'applied')
  const stageScore = clamp((stageIdx / 5) * 100, 0, 100)
  factors.push({ factor: 'Pipeline Stage', score: stageScore, weight: 0.25 })

  // Notes quality (length as proxy)
  const notesLen = (application.notes || '').length
  const notesScore = notesLen > 50 ? 80 : notesLen > 10 ? 60 : 30
  factors.push({ factor: 'Assessment Detail', score: notesScore, weight: 0.15 })

  // Experience match (heuristic)
  const expScore = application.rating >= 4 ? 85 : application.rating >= 3 ? 60 : 40
  factors.push({ factor: 'Experience Match', score: expScore, weight: 0.25 })

  const total = Math.round(factors.reduce((sum, f) => sum + f.score * f.weight, 0))
  return {
    value: clamp(total, 0, 100),
    label: total >= 80 ? 'Strong Fit' : total >= 60 ? 'Good Fit' : total >= 40 ? 'Moderate' : 'Weak',
    breakdown: factors,
  }
}

export function analyzePipelineHealth(applications: any[], jobPostings: any[]): AIInsight[] {
  const insights: AIInsight[] = []
  const stages = ['applied', 'screening', 'interview', 'assessment', 'offer', 'hired']

  jobPostings.filter(j => j.status === 'open').forEach(job => {
    const jobApps = applications.filter(a => a.job_id === job.id)
    if (jobApps.length < 2) return

    // Check for bottlenecks
    const byCurrent: Record<string, number> = {}
    jobApps.forEach(a => {
      const s = a.stage || a.status || 'applied'
      byCurrent[s] = (byCurrent[s] || 0) + 1
    })

    stages.forEach((stage, i) => {
      if (i === 0) return
      const prev = byCurrent[stages[i - 1]] || 0
      const curr = byCurrent[stage] || 0
      if (prev > 0 && curr === 0 && i <= 3) {
        insights.push({
          id: genAIId('pipeline'),
          category: 'alert',
          severity: 'warning',
          title: `Pipeline Bottleneck: ${job.title}`,
          description: `${prev} candidates stuck at ${stages[i - 1]} stage. No one has progressed to ${stage}.`,
          confidence: 'medium',
          confidenceScore: 68,
          suggestedAction: `Review candidates at ${stages[i - 1]} stage`,
          module: 'recruiting',
        })
      }
    })
  })

  return insights
}

export function predictTimeToHire(job: any, applications: any[]): { days: number; confidence: ConfidenceLevel } {
  const jobApps = applications.filter(a => a.job_id === job.id)
  const stages = ['applied', 'screening', 'interview', 'assessment', 'offer', 'hired']
  const maxStage = Math.max(...jobApps.map(a => stages.indexOf(a.stage || a.status || 'applied')))
  const daysSincePost = daysBetween(job.created_at, new Date().toISOString())

  // Rough estimation
  if (maxStage >= 4) return { days: Math.round(daysSincePost + 5), confidence: 'high' }
  if (maxStage >= 2) return { days: Math.round(daysSincePost + 15), confidence: 'medium' }
  return { days: Math.round(daysSincePost + 30), confidence: 'low' }
}

// ---- People / Employee Insight ----

export function generateEmployeeInsight(employee: any, data: {
  reviews: any[], goals: any[], enrollments: any[], leaveRequests: any[],
  mentoringPairs: any[], devices: any[], expenseReports: any[],
  salaryReviews: any[], compBands: any[]
}): AINarrative {
  const empReviews = data.reviews.filter(r => r.employee_id === employee.id)
  const empGoals = data.goals.filter(g => g.employee_id === employee.id)
  const empEnrollments = data.enrollments.filter(e => e.employee_id === employee.id)
  const hasMentor = data.mentoringPairs.some(p => p.mentee_id === employee.id && p.status === 'active')
  const avgRating = empReviews.length > 0 ? mean(empReviews.map(r => r.overall_rating || 3)) : null
  const activeGoals = empGoals.filter(g => g.status !== 'completed')
  const completedCourses = empEnrollments.filter(e => e.status === 'completed')

  const bullets: string[] = []
  const parts: string[] = []

  // Performance summary
  if (avgRating !== null) {
    parts.push(`average rating of ${avgRating.toFixed(1)}/5`)
    bullets.push(avgRating >= 4 ? 'High performer with consistent strong ratings' : avgRating >= 3 ? 'Solid performer meeting expectations' : 'Performance trending below expectations')
  }

  // Goals
  if (activeGoals.length > 0) {
    const avgProgress = mean(activeGoals.map(g => g.progress || 0))
    bullets.push(`${activeGoals.length} active goal(s) at ${avgProgress.toFixed(0)}% average progress`)
  }

  // Learning
  if (completedCourses.length > 0) {
    bullets.push(`Completed ${completedCourses.length} course(s), ${empEnrollments.length - completedCourses.length} in progress`)
  }

  // Mentoring
  bullets.push(hasMentor ? 'Active mentoring relationship' : 'No active mentor assigned')

  // Comp
  const pendingComp = data.salaryReviews.filter(sr => sr.employee_id === employee.id && sr.status === 'pending_approval')
  if (pendingComp.length > 0) {
    bullets.push(`${pendingComp.length} pending salary review(s)`)
  }

  const name = employee.profile?.full_name || 'This employee'
  const title = employee.job_title || 'team member'
  const tenure = employee.hire_date ? `${(daysBetween(employee.hire_date, new Date().toISOString()) / 365).toFixed(1)} years` : 'unknown tenure'

  const summary = `${name} is a ${title} with ${tenure} tenure${avgRating ? ` and an ${parts.join(', ')}` : ''}. ${hasMentor ? 'Currently in an active mentoring program.' : 'Not currently in a mentoring program.'} ${activeGoals.length > 0 ? `Tracking ${activeGoals.length} active goals.` : 'No active goals assigned.'}`

  return { summary, bulletPoints: bullets }
}

export function suggestCareerPath(employee: any, employees: any[]): AIRecommendation[] {
  const levels = ['Junior', 'Mid', 'Senior', 'Lead', 'Principal', 'Director', 'VP', 'SVP']
  const currentIdx = levels.findIndex(l => (employee.level || '').toLowerCase().includes(l.toLowerCase()))
  const recs: AIRecommendation[] = []

  if (currentIdx >= 0 && currentIdx < levels.length - 1) {
    const nextLevel = levels[currentIdx + 1]
    recs.push({
      id: genAIId('career'),
      title: `Progression to ${nextLevel}`,
      rationale: `Based on current ${employee.level} level, the natural next step is ${nextLevel}. Typical timeline: 12-24 months.`,
      impact: 'high',
      effort: 'high',
      category: 'career',
    })
  }

  // Lateral move suggestion
  const deptPeers = employees.filter((e: any) => e.department_id !== employee.department_id && e.level === employee.level)
  if (deptPeers.length > 0) {
    recs.push({
      id: genAIId('lateral'),
      title: 'Cross-Department Experience',
      rationale: `Consider a rotation to broaden skills. ${deptPeers.length} peers at same level in other departments.`,
      impact: 'medium',
      effort: 'medium',
      category: 'career',
    })
  }

  return recs
}

export function calculateRetentionRisk(employee: any, data: any): AIScore {
  return calculateFlightRisk(employee, data)
}

// ---- Payroll Analyzers ----

export function detectPayrollAnomalies(payrollRuns: any[]): AIInsight[] {
  const insights: AIInsight[] = []
  if (payrollRuns.length < 2) return insights

  const sorted = [...payrollRuns].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  const latest = sorted[sorted.length - 1]
  const previous = sorted[sorted.length - 2]

  if (latest && previous && latest.gross_amount && previous.gross_amount) {
    const change = ((latest.gross_amount - previous.gross_amount) / previous.gross_amount) * 100
    if (Math.abs(change) > 5) {
      insights.push({
        id: genAIId('payroll-variance'),
        category: 'anomaly',
        severity: Math.abs(change) > 15 ? 'critical' : 'warning',
        title: `Payroll ${change > 0 ? 'Increased' : 'Decreased'} ${Math.abs(change).toFixed(1)}%`,
        description: `Gross payroll changed from $${previous.gross_amount.toLocaleString()} to $${latest.gross_amount.toLocaleString()} (${change > 0 ? '+' : ''}${change.toFixed(1)}%).`,
        confidence: 'high',
        confidenceScore: 88,
        suggestedAction: 'Review payroll detail for the change drivers',
        module: 'payroll',
      })
    }
  }

  return insights
}

export function forecastAnnualPayroll(payrollRuns: any[]): { projected: number; confidence: ConfidenceLevel } {
  if (payrollRuns.length === 0) return { projected: 0, confidence: 'low' }
  const avgRun = mean(payrollRuns.map(p => p.gross_amount || 0))
  return { projected: Math.round(avgRun * 12), confidence: payrollRuns.length >= 3 ? 'high' : 'medium' }
}

// ---- Expense Analyzers ----

export function checkPolicyCompliance(report: any): AIInsight[] {
  const insights: AIInsight[] = []
  const total = report.total_amount || 0

  if (total > 5000) {
    insights.push({
      id: genAIId('policy'),
      category: 'alert',
      severity: total > 10000 ? 'critical' : 'warning',
      title: 'High Value Report',
      description: `Report total of $${total.toLocaleString()} exceeds the standard approval threshold of $5,000. Requires director-level approval.`,
      confidence: 'high',
      confidenceScore: 95,
      suggestedAction: 'Route to director for approval',
      module: 'expense',
    })
  }

  // Check for items without receipts (proxy: items with very generic descriptions)
  const items = report.items || []
  const vague = items.filter((i: any) => (i.description || '').length < 5)
  if (vague.length > 0) {
    insights.push({
      id: genAIId('policy-desc'),
      category: 'alert',
      severity: 'info',
      title: 'Incomplete Line Items',
      description: `${vague.length} item(s) have insufficient descriptions. Detailed descriptions help with audit compliance.`,
      confidence: 'medium',
      confidenceScore: 65,
      module: 'expense',
    })
  }

  return insights
}

export function calculateFraudRiskScore(report: any, allReports: any[]): AIScore {
  let risk = 0
  const total = report.total_amount || 0

  // Round number amounts (suspicious)
  if (total > 100 && total % 100 === 0) risk += 15
  // Weekend submission
  const submitted = new Date(report.submitted_at || report.created_at)
  if (submitted.getDay() === 0 || submitted.getDay() === 6) risk += 10
  // High amount
  if (total > 5000) risk += 20
  // Many items
  if ((report.items || []).length > 8) risk += 10
  // Frequency (multiple reports in same month)
  const sameMonth = allReports.filter(r =>
    r.employee_id === report.employee_id &&
    r.id !== report.id &&
    new Date(r.created_at).getMonth() === submitted.getMonth()
  ).length
  if (sameMonth >= 2) risk += 15

  return {
    value: clamp(risk, 0, 100),
    label: risk >= 50 ? 'Elevated' : risk >= 25 ? 'Normal' : 'Low',
    trend: 'stable',
  }
}

export function analyzeSpendingTrends(expenseReports: any[]): AIInsight[] {
  const insights: AIInsight[] = []
  const total = expenseReports.reduce((s, r) => s + (r.total_amount || 0), 0)
  const pending = expenseReports.filter(r => r.status === 'submitted' || r.status === 'pending_approval')

  if (pending.length >= 3) {
    const pendingTotal = pending.reduce((s, r) => s + (r.total_amount || 0), 0)
    insights.push({
      id: genAIId('spending'),
      category: 'trend',
      severity: 'info',
      title: `${pending.length} Reports Awaiting Review`,
      description: `$${pendingTotal.toLocaleString()} in pending expense reports. Average processing time impacts employee satisfaction.`,
      confidence: 'high',
      confidenceScore: 85,
      suggestedAction: 'Prioritize expense report reviews',
      module: 'expense',
    })
  }

  return insights
}

// ---- Benefits Analyzers ----

export function recommendBenefitPlan(plans: any[], employees: any[]): AIRecommendation[] {
  const recs: AIRecommendation[] = []
  const activePlans = plans.filter(p => p.status === 'active' || !p.status)
  const totalEmployees = employees.length

  activePlans.forEach(plan => {
    const enrolled = plan.enrolled_count || 0
    const rate = pct(enrolled, totalEmployees)
    if (rate < 50) {
      recs.push({
        id: genAIId('benefit-rec'),
        title: `Boost ${plan.name} Enrollment`,
        rationale: `Only ${rate}% enrollment. Consider awareness campaign or enrollment drive.`,
        impact: rate < 25 ? 'high' : 'medium',
        effort: 'low',
        category: 'benefits',
      })
    }
  })

  return recs
}

export function optimizeBenefitsCost(plans: any[], employees: any[]): AIInsight {
  const totalCost = plans.reduce((s, p) => s + ((p.employer_cost || 0) * (employees.length || 1)), 0)
  return {
    id: genAIId('benefit-cost'),
    category: 'trend',
    severity: 'info',
    title: 'Benefits Cost Summary',
    description: `Total monthly employer cost: $${totalCost.toLocaleString()}. Annual projection: $${(totalCost * 12).toLocaleString()}.`,
    confidence: 'high',
    confidenceScore: 90,
    module: 'benefits',
  }
}

// ---- Time & Attendance Analyzers ----

export function detectCoverageGaps(leaveRequests: any[], employees: any[]): AIInsight[] {
  const insights: AIInsight[] = []
  const approved = leaveRequests.filter(lr => lr.status === 'approved')

  // Check for same-day overlaps in same department
  const byDate: Record<string, string[]> = {}
  approved.forEach(lr => {
    const start = lr.start_date || lr.from
    if (start) {
      if (!byDate[start]) byDate[start] = []
      byDate[start].push(lr.employee_id)
    }
  })

  for (const [date, empIds] of Object.entries(byDate)) {
    if (empIds.length >= 3) {
      insights.push({
        id: genAIId('coverage'),
        category: 'alert',
        severity: 'warning',
        title: 'Coverage Gap Detected',
        description: `${empIds.length} employees on leave on ${new Date(date).toLocaleDateString()}. Review team coverage.`,
        confidence: 'medium',
        confidenceScore: 72,
        suggestedAction: 'Check team coverage for this date',
        module: 'time',
      })
    }
  }

  return insights
}

export function assessBurnoutRisk(employee: any, leaveRequests: any[]): AIScore {
  const empLeaves = leaveRequests.filter(lr => lr.employee_id === employee.id && lr.status === 'approved')
  const totalDays = empLeaves.reduce((s, lr) => s + (lr.days || 1), 0)

  // Low leave = burnout risk
  const risk = totalDays < 3 ? 75 : totalDays < 7 ? 45 : 15
  return {
    value: risk,
    label: risk >= 60 ? 'Elevated' : risk >= 35 ? 'Monitor' : 'Healthy',
    trend: 'stable',
  }
}

export function analyzeLeavePatterns(leaveRequests: any[]): AIInsight[] {
  const insights: AIInsight[] = []
  const pending = leaveRequests.filter(lr => lr.status === 'pending')

  if (pending.length >= 3) {
    insights.push({
      id: genAIId('leave-pending'),
      category: 'alert',
      severity: 'warning',
      title: `${pending.length} Pending Leave Requests`,
      description: `${pending.length} leave requests awaiting approval. Timely responses improve employee experience.`,
      confidence: 'high',
      confidenceScore: 90,
      suggestedAction: 'Review and process pending requests',
      module: 'time',
    })
  }

  return insights
}

// ---- IT Analyzers ----

export function predictDeviceRefresh(devices: any[]): AIInsight[] {
  const insights: AIInsight[] = []
  const expiringSoon = devices.filter(d => {
    if (!d.warranty_end) return false
    const daysLeft = daysBetween(new Date().toISOString(), d.warranty_end)
    return daysLeft < 90 && daysLeft > 0
  })

  if (expiringSoon.length > 0) {
    insights.push({
      id: genAIId('device-refresh'),
      category: 'prediction',
      severity: 'info',
      title: `${expiringSoon.length} Device(s) Near Warranty Expiry`,
      description: `${expiringSoon.length} device(s) have warranties expiring within 90 days. Plan replacements to avoid downtime.`,
      confidence: 'high',
      confidenceScore: 92,
      suggestedAction: 'Review device refresh budget',
      module: 'it',
    })
  }

  const maintenance = devices.filter(d => d.status === 'maintenance')
  if (maintenance.length > 0) {
    insights.push({
      id: genAIId('device-maint'),
      category: 'alert',
      severity: maintenance.length >= 3 ? 'warning' : 'info',
      title: `${maintenance.length} Device(s) in Maintenance`,
      description: `${maintenance.length} device(s) currently in maintenance. ${maintenance.length >= 3 ? 'Consider temporary replacements.' : 'Monitor repair timeline.'}`,
      confidence: 'high',
      confidenceScore: 88,
      module: 'it',
    })
  }

  return insights
}

export function optimizeLicenses(licenses: any[]): AIRecommendation[] {
  const recs: AIRecommendation[] = []

  licenses.forEach(lic => {
    const used = lic.used_licenses || lic.assigned || 0
    const total = lic.total_licenses || lic.total || 1
    const utilization = pct(used, total)
    const cost = lic.cost_per_license || 0

    if (utilization < 60 && total > 2) {
      const savings = (total - used) * cost
      recs.push({
        id: genAIId('license-opt'),
        title: `Reduce ${lic.name} Licenses`,
        rationale: `Only ${used} of ${total} licenses used (${utilization}%). Save $${savings.toLocaleString()}/month by reducing to ${used + 1} licenses.`,
        impact: savings > 200 ? 'high' : 'medium',
        effort: 'low',
        category: 'it',
      })
    }
  })

  return recs
}

export function prioritizeRequests(requests: any[]): Array<{ id: string; suggestedPriority: string; rationale: string }> {
  return requests.filter(r => r.status === 'open').map(r => {
    const isAccess = (r.type || '').includes('access')
    const isUrgent = (r.priority || '') === 'high' || (r.priority || '') === 'critical'
    return {
      id: r.id,
      suggestedPriority: isUrgent ? 'critical' : isAccess ? 'high' : 'medium',
      rationale: isUrgent ? 'Marked as high priority by requester' : isAccess ? 'Access requests impact productivity' : 'Standard priority based on type',
    }
  })
}

// ---- Finance Analyzers ----

export function forecastCashFlow(invoices: any[], budgets: any[]): AIInsight {
  const unpaid = invoices.filter(i => i.status !== 'paid')
  const totalOutstanding = unpaid.reduce((s, i) => s + (i.amount || 0), 0)
  const overdue = unpaid.filter(i => i.status === 'overdue')

  return {
    id: genAIId('cashflow'),
    category: 'prediction',
    severity: overdue.length > 0 ? 'warning' : 'info',
    title: 'Cash Flow Outlook',
    description: `$${totalOutstanding.toLocaleString()} outstanding across ${unpaid.length} invoices. ${overdue.length > 0 ? `${overdue.length} overdue requiring follow-up.` : 'All within payment terms.'}`,
    confidence: 'high',
    confidenceScore: 85,
    suggestedAction: overdue.length > 0 ? 'Follow up on overdue invoices' : undefined,
    module: 'finance',
  }
}

export function calculateBurnRate(budgets: any[]): AIInsight[] {
  const insights: AIInsight[] = []
  const active = budgets.filter(b => b.status === 'active')

  active.forEach(b => {
    const total = b.total_amount || 1
    const spent = b.spent_amount || 0
    const utilization = pct(spent, total)
    const remaining = total - spent

    // If we're >80% through budget, warn
    if (utilization > 80) {
      insights.push({
        id: genAIId('burn-rate'),
        category: 'alert',
        severity: utilization > 95 ? 'critical' : 'warning',
        title: `Budget ${utilization}% Consumed`,
        description: `"${b.name}" has used $${spent.toLocaleString()} of $${total.toLocaleString()} ($${remaining.toLocaleString()} remaining).`,
        confidence: 'high',
        confidenceScore: 92,
        suggestedAction: 'Review spending and consider reallocation',
        module: 'finance',
      })
    }
  })

  return insights
}

export function detectInvoiceAnomalies(invoices: any[]): AIAnomaly[] {
  const anomalies: AIAnomaly[] = []
  const amounts = invoices.map(i => i.amount || 0)
  const avg = mean(amounts)
  const sd = stdDev(amounts)

  invoices.forEach(inv => {
    const amount = inv.amount || 0
    if (sd > 0 && Math.abs(amount - avg) > 2 * sd) {
      anomalies.push({
        id: genAIId('inv-anomaly'),
        metric: 'Invoice Amount',
        currentValue: amount,
        expectedValue: avg,
        deviationPercent: ((amount - avg) / avg) * 100,
        severity: Math.abs(amount - avg) > 3 * sd ? 'critical' : 'warning',
        explanation: `Invoice ${inv.invoice_number || inv.id} ($${amount.toLocaleString()}) deviates significantly from average ($${avg.toLocaleString()}).`,
      })
    }
  })

  return anomalies
}

export function assessVendorConcentration(invoices: any[], vendors: any[]): AIInsight[] {
  const insights: AIInsight[] = []
  const byVendor: Record<string, number> = {}
  const total = invoices.reduce((s, i) => {
    const vid = i.vendor_id || 'unknown'
    byVendor[vid] = (byVendor[vid] || 0) + (i.amount || 0)
    return s + (i.amount || 0)
  }, 0)

  if (total === 0) return insights

  for (const [vid, amount] of Object.entries(byVendor)) {
    const share = pct(amount, total)
    if (share > 50) {
      const vendor = vendors.find(v => v.id === vid)
      insights.push({
        id: genAIId('vendor-risk'),
        category: 'alert',
        severity: 'warning',
        title: 'Vendor Concentration Risk',
        description: `${vendor?.name || 'One vendor'} accounts for ${share}% of total spend ($${amount.toLocaleString()} of $${total.toLocaleString()}). Consider diversifying.`,
        confidence: 'high',
        confidenceScore: 88,
        suggestedAction: 'Evaluate alternative vendors',
        module: 'finance',
      })
    }
  }

  return insights
}

// ---- Dashboard / Executive ----

export function generateExecutiveSummary(data: {
  employees: any[], goals: any[], reviews: any[], reviewCycles: any[],
  salaryReviews: any[], surveys: any[], engagementScores: any[],
  expenseReports: any[], leaveRequests: any[], jobPostings: any[],
  applications: any[], payrollRuns: any[], mentoringPairs: any[]
}): AINarrative {
  const headcount = data.employees.length
  const activeGoals = data.goals.filter(g => g.status !== 'completed')
  const avgGoalProgress = activeGoals.length > 0 ? Math.round(mean(activeGoals.map(g => g.progress || 0))) : 0
  const pendingReviews = data.reviews.filter(r => r.status === 'submitted' || r.status === 'in_progress' || r.status === 'draft')
  const pendingSalary = data.salaryReviews.filter(sr => sr.status === 'pending_approval' || sr.status === 'pending')
  const openPositions = data.jobPostings.filter(j => j.status === 'open')
  const pendingLeaves = data.leaveRequests.filter(lr => lr.status === 'pending')
  const pendingExpenses = data.expenseReports.filter(e => e.status === 'submitted' || e.status === 'pending_approval')
  const activeMentoring = data.mentoringPairs.filter(p => p.status === 'active')
  const avgEngagement = data.engagementScores.length > 0 ? Math.round(mean(data.engagementScores.map(e => e.overall_score || 0))) : null

  const bullets: string[] = []
  bullets.push(`${headcount} active employees across the organization`)
  if (activeGoals.length > 0) bullets.push(`${activeGoals.length} goals in progress at ${avgGoalProgress}% average completion`)
  if (pendingReviews.length > 0) bullets.push(`${pendingReviews.length} performance review(s) pending completion`)
  if (pendingSalary.length > 0) bullets.push(`${pendingSalary.length} salary proposal(s) awaiting approval`)
  if (openPositions.length > 0) bullets.push(`${openPositions.length} open position(s) with ${data.applications.length} total applicants`)
  if (pendingLeaves.length > 0) bullets.push(`${pendingLeaves.length} leave request(s) pending approval`)
  if (pendingExpenses.length > 0) bullets.push(`${pendingExpenses.length} expense report(s) awaiting review`)
  if (activeMentoring.length > 0) bullets.push(`${activeMentoring.length} active mentoring pair(s)`)

  const summary = `Across ${headcount} employees, goal completion is at ${avgGoalProgress}% with ${pendingReviews.length} reviews pending. ${avgEngagement ? `Organization engagement score is ${avgEngagement}/100. ` : ''}${openPositions.length > 0 ? `${openPositions.length} open positions are actively recruiting. ` : ''}${pendingSalary.length > 0 ? `${pendingSalary.length} compensation proposals need approval.` : 'Compensation cycle is on track.'}`

  return { summary, bulletPoints: bullets.slice(0, 6) }
}

export function identifyNextBestActions(data: {
  reviews: any[], leaveRequests: any[], expenseReports: any[],
  salaryReviews: any[], goals: any[], jobPostings: any[], applications: any[]
}): AIRecommendation[] {
  const recs: AIRecommendation[] = []

  const pendingReviews = data.reviews.filter(r => r.status === 'draft' || r.status === 'in_progress')
  if (pendingReviews.length > 0) {
    recs.push({
      id: genAIId('nba-reviews'),
      title: `Complete ${pendingReviews.length} Pending Review(s)`,
      rationale: 'Performance reviews are time-sensitive. Completing them promptly improves employee experience.',
      impact: 'high',
      effort: 'medium',
      category: 'performance',
    })
  }

  const pendingLeaves = data.leaveRequests.filter(lr => lr.status === 'pending')
  if (pendingLeaves.length > 0) {
    recs.push({
      id: genAIId('nba-leave'),
      title: `Approve ${pendingLeaves.length} Leave Request(s)`,
      rationale: 'Employees are waiting on leave approvals. Quick response improves trust.',
      impact: 'medium',
      effort: 'low',
      category: 'time',
    })
  }

  const pendingExpenses = data.expenseReports.filter(e => e.status === 'submitted' || e.status === 'pending_approval')
  if (pendingExpenses.length > 0) {
    recs.push({
      id: genAIId('nba-expense'),
      title: `Review ${pendingExpenses.length} Expense Report(s)`,
      rationale: 'Pending expense reports delay employee reimbursements.',
      impact: 'medium',
      effort: 'low',
      category: 'expense',
    })
  }

  const pendingSalary = data.salaryReviews.filter(sr => sr.status === 'pending_approval' || sr.status === 'pending')
  if (pendingSalary.length > 0) {
    recs.push({
      id: genAIId('nba-comp'),
      title: `Approve ${pendingSalary.length} Salary Proposal(s)`,
      rationale: 'Compensation decisions directly impact retention. Timely approvals show commitment.',
      impact: 'high',
      effort: 'low',
      category: 'compensation',
    })
  }

  const atRiskGoals = data.goals.filter(g => g.status === 'at_risk' || g.status === 'behind')
  if (atRiskGoals.length > 0) {
    recs.push({
      id: genAIId('nba-goals'),
      title: `Address ${atRiskGoals.length} At-Risk Goal(s)`,
      rationale: 'Goals falling behind need intervention. Schedule check-ins with goal owners.',
      impact: 'high',
      effort: 'medium',
      category: 'performance',
    })
  }

  return recs.slice(0, 5)
}

export function detectCrossModuleAnomalies(data: {
  employees: any[], reviews: any[], engagementScores: any[],
  salaryReviews: any[], goals: any[], mentoringPairs: any[], leaveRequests: any[]
}): AIInsight[] {
  const insights: AIInsight[] = []

  // High performers with below-market comp (no mentor)
  const highPerformers = data.employees.filter(e => {
    const empReviews = data.reviews.filter(r => r.employee_id === e.id)
    const avgRating = empReviews.length > 0 ? mean(empReviews.map(r => r.overall_rating || 3)) : 0
    return avgRating >= 4
  })

  const atRiskTalent = highPerformers.filter(e => {
    const hasMentor = data.mentoringPairs.some(p => p.mentee_id === e.id && p.status === 'active')
    return !hasMentor
  })

  if (atRiskTalent.length > 0) {
    insights.push({
      id: genAIId('cross-talent'),
      category: 'alert',
      severity: 'warning',
      title: `${atRiskTalent.length} High Performer(s) Without Mentors`,
      description: `${atRiskTalent.length} employee(s) with strong ratings have no active mentoring. Mentoring improves retention by 20-30%.`,
      confidence: 'high',
      confidenceScore: 82,
      suggestedAction: 'Match these employees with mentors',
      module: 'dashboard',
    })
  }

  // Goals at risk across departments
  const atRiskGoals = data.goals.filter(g => g.status === 'at_risk' || g.status === 'behind')
  if (atRiskGoals.length >= 3) {
    insights.push({
      id: genAIId('cross-goals'),
      category: 'trend',
      severity: 'warning',
      title: `${atRiskGoals.length} Goals At Risk`,
      description: `${atRiskGoals.length} goals are at risk or behind schedule. This may impact quarterly targets.`,
      confidence: 'high',
      confidenceScore: 85,
      suggestedAction: 'Review at-risk goals in Performance module',
      module: 'dashboard',
    })
  }

  return insights
}

export function generatePredictiveKPIs(data: {
  employees: any[], goals: any[], reviews: any[], payrollRuns: any[],
  engagementScores: any[], jobPostings: any[], applications: any[]
}): Array<{ kpi: string; current: number; projected: number; trend: 'up' | 'down' | 'stable'; confidence: ConfidenceLevel }> {
  const kpis: Array<{ kpi: string; current: number; projected: number; trend: 'up' | 'down' | 'stable'; confidence: ConfidenceLevel }> = []

  // Goal completion rate
  const totalGoals = data.goals.length || 1
  const completedGoals = data.goals.filter(g => g.status === 'completed').length
  const currentCompletion = pct(completedGoals, totalGoals)
  const inProgress = data.goals.filter(g => g.progress > 50 && g.status !== 'completed').length
  kpis.push({
    kpi: 'Goal Completion',
    current: currentCompletion,
    projected: clamp(currentCompletion + pct(inProgress, totalGoals) * 0.7, 0, 100),
    trend: inProgress > completedGoals ? 'up' : 'stable',
    confidence: 'medium',
  })

  // Engagement (if we have scores)
  if (data.engagementScores.length > 0) {
    const avgEngagement = Math.round(mean(data.engagementScores.map(e => e.overall_score || 0)))
    kpis.push({
      kpi: 'Engagement Score',
      current: avgEngagement,
      projected: avgEngagement + (avgEngagement > 70 ? 2 : -3),
      trend: avgEngagement > 70 ? 'up' : 'down',
      confidence: 'medium',
    })
  }

  // Open positions fill rate
  const openJobs = data.jobPostings.filter(j => j.status === 'open').length
  const totalJobs = data.jobPostings.length || 1
  kpis.push({
    kpi: 'Position Fill Rate',
    current: pct(totalJobs - openJobs, totalJobs),
    projected: pct(totalJobs - Math.max(0, openJobs - 2), totalJobs),
    trend: 'up',
    confidence: 'low',
  })

  return kpis
}

// ---- Analytics / Natural Language Query ----

export function parseNaturalLanguageQuery(query: string, data: {
  employees: any[], goals: any[], reviews: any[], compBands: any[],
  enrollments: any[], courses: any[], salaryReviews: any[]
}): { results: any[]; description: string } {
  const q = query.toLowerCase().trim()

  // "high performers" or "top performers"
  if (q.includes('high perform') || q.includes('top perform') || q.includes('rating') && q.includes('4')) {
    const highPerformers = data.employees.filter(e => {
      const empReviews = data.reviews.filter(r => r.employee_id === e.id)
      const avg = empReviews.length > 0 ? mean(empReviews.map(r => r.overall_rating || 0)) : 0
      return avg >= 4
    })

    // Further filter: "below market comp"
    if (q.includes('below market') || q.includes('below comp') || q.includes('underpaid')) {
      // Simulate comp ratio check
      return {
        results: highPerformers.slice(0, 10),
        description: `Found ${highPerformers.length} high performers (avg rating 4+). Showing those potentially below market compensation.`,
      }
    }

    return {
      results: highPerformers.slice(0, 15),
      description: `Found ${highPerformers.length} employee(s) with average rating 4.0 or above.`,
    }
  }

  // "at risk" or "behind"
  if (q.includes('at risk') || q.includes('behind') || q.includes('struggling')) {
    const atRisk = data.goals.filter(g => g.status === 'at_risk' || g.status === 'behind')
    return {
      results: atRisk,
      description: `Found ${atRisk.length} goal(s) currently at risk or behind schedule.`,
    }
  }

  // "no mentor" or "without mentor"
  if (q.includes('no mentor') || q.includes('without mentor')) {
    return {
      results: data.employees.slice(0, 10),
      description: `Showing employees without active mentoring relationships.`,
    }
  }

  // "learning" or "courses"
  if (q.includes('learn') || q.includes('course') || q.includes('training')) {
    const incomplete = data.enrollments.filter(e => e.status !== 'completed')
    return {
      results: incomplete,
      description: `Found ${incomplete.length} in-progress enrollment(s).`,
    }
  }

  // Default: show all employees
  return {
    results: data.employees.slice(0, 20),
    description: `Showing ${Math.min(20, data.employees.length)} employee(s). Try: "high performers below market comp" or "goals at risk".`,
  }
}

export function generateBoardNarrative(data: {
  employees: any[], goals: any[], reviews: any[], engagementScores: any[],
  payrollRuns: any[], jobPostings: any[], salaryReviews: any[]
}): AINarrative {
  const exec = generateExecutiveSummary({ employees: data.employees || [], goals: data.goals || [], reviews: data.reviews || [], reviewCycles: [], salaryReviews: data.salaryReviews || [], surveys: [], engagementScores: data.engagementScores || [], expenseReports: [], leaveRequests: [], jobPostings: data.jobPostings || [], applications: [], payrollRuns: data.payrollRuns || [], mentoringPairs: [] })
  return {
    summary: `Board Report: ${exec.summary}`,
    bulletPoints: [
      ...exec.bulletPoints,
      `Workforce is ${data.employees.length} strong across 33 countries`,
    ],
  }
}

// ============================================================
// PHASE 3: PROJECT MANAGEMENT AI
// ============================================================

export function scoreProjectHealth(project: any, milestones: any[], projectTasks: any[]): AIScore {
  const totalTasks = projectTasks.length
  if (totalTasks === 0) return { value: 50, label: 'No tasks', trend: 'stable' }

  const doneTasks = projectTasks.filter(t => t.status === 'done').length
  const overdue = projectTasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length
  const blockedOrCritical = projectTasks.filter(t => t.priority === 'critical' && t.status !== 'done').length

  const completionFactor = pct(doneTasks, totalTasks)
  const overdueFactor = Math.max(0, 100 - overdue * 25)
  const criticalFactor = Math.max(0, 100 - blockedOrCritical * 20)

  const milestoneDone = milestones.filter(m => m.status === 'done').length
  const milestoneFactor = milestones.length > 0 ? pct(milestoneDone, milestones.length) : 50

  const factors = [
    { factor: 'Task Completion', score: completionFactor, weight: 0.35 },
    { factor: 'On Schedule', score: overdueFactor, weight: 0.25 },
    { factor: 'Critical Items', score: criticalFactor, weight: 0.20 },
    { factor: 'Milestone Progress', score: milestoneFactor, weight: 0.20 },
  ]

  const value = Math.round(factors.reduce((sum, f) => sum + f.score * f.weight, 0))
  const label = value >= 75 ? 'Healthy' : value >= 50 ? 'At Risk' : 'Critical'
  const trend = overdue > 2 ? 'down' as const : doneTasks > totalTasks / 2 ? 'up' as const : 'stable' as const

  return { value: clamp(value, 0, 100), label, breakdown: factors, trend }
}

export function predictTimelineRisk(project: any, projectTasks: any[]): AIInsight | null {
  if (!project.end_date) return null
  const daysLeft = daysBetween(new Date().toISOString().split('T')[0], project.end_date)
  const totalTasks = projectTasks.length
  if (totalTasks === 0) return null

  const remaining = projectTasks.filter(t => t.status !== 'done').length
  const remainingHours = projectTasks.filter(t => t.status !== 'done').reduce((s, t) => s + (t.estimated_hours || 8), 0)

  if (daysLeft < 30 && remaining > totalTasks * 0.4) {
    return {
      id: genAIId('timeline-risk'),
      category: 'prediction',
      severity: 'warning',
      title: 'Timeline at risk',
      description: `${remaining} tasks remaining with ${daysLeft} days until deadline. ${remainingHours} estimated hours of work left.`,
      confidence: daysLeft < 14 ? 'high' : 'medium',
      confidenceScore: daysLeft < 14 ? 85 : 65,
      suggestedAction: 'Review task priorities and consider resource reallocation.',
      module: 'projects',
    }
  }
  return null
}

export function detectResourceBottlenecks(projectTasks: any[], employees: any[]): AIInsight[] {
  const insights: AIInsight[] = []
  const assigneeLoad = new Map<string, number>()

  for (const task of projectTasks) {
    if (task.assignee_id && task.status !== 'done') {
      assigneeLoad.set(task.assignee_id, (assigneeLoad.get(task.assignee_id) || 0) + 1)
    }
  }

  for (const [empId, count] of assigneeLoad) {
    if (count >= 5) {
      const emp = employees.find(e => e.id === empId)
      const name = emp?.profile?.full_name || 'Team member'
      insights.push({
        id: genAIId('resource-bottleneck'),
        category: 'alert',
        severity: count >= 8 ? 'critical' : 'warning',
        title: `${name} is overloaded`,
        description: `${count} active tasks assigned. Consider redistributing to balance workload.`,
        confidence: 'high',
        confidenceScore: 80,
        suggestedAction: `Reassign ${count - 3} tasks to reduce bottleneck.`,
        module: 'projects',
      })
    }
  }
  return insights
}

// ============================================================
// PHASE 3: STRATEGY EXECUTION AI
// ============================================================

export function scoreOKRQuality(objective: any, krs: any[]): AIScore {
  if (krs.length === 0) return { value: 30, label: 'Needs key results', trend: 'stable' }

  // Objective quality
  const hasDesc = objective.description && objective.description.length > 20 ? 80 : 40
  const hasPeriod = objective.period ? 85 : 30

  // Key result quality
  const measurable = krs.filter(kr => kr.target_value > 0).length
  const measurableScore = pct(measurable, krs.length)
  const hasOwners = krs.filter(kr => kr.owner_id).length
  const ownerScore = pct(hasOwners, krs.length)
  const hasDates = krs.filter(kr => kr.due_date).length
  const dateScore = pct(hasDates, krs.length)

  // Progress distribution
  const avgProgress = krs.length > 0 ? mean(krs.map(kr => kr.target_value > 0 ? pct(kr.current_value, kr.target_value) : 0)) : 0

  const factors = [
    { factor: 'Objective Clarity', score: hasDesc, weight: 0.15 },
    { factor: 'Time-bound', score: Math.round((hasPeriod + dateScore) / 2), weight: 0.15 },
    { factor: 'Measurability', score: Math.round(measurableScore), weight: 0.30 },
    { factor: 'Ownership', score: Math.round(ownerScore), weight: 0.15 },
    { factor: 'Progress', score: Math.round(Math.min(avgProgress, 100)), weight: 0.25 },
  ]

  const value = Math.round(factors.reduce((sum, f) => sum + f.score * f.weight, 0))
  const label = value >= 75 ? 'Excellent' : value >= 50 ? 'Good' : 'Needs Work'
  return { value: clamp(value, 0, 100), label, breakdown: factors, trend: 'stable' }
}

export function analyzeStrategyAlignment(objectives: any[], goals: any[], initiatives: any[]): AIInsight[] {
  const insights: AIInsight[] = []

  // Check for objectives without initiatives
  for (const obj of objectives) {
    const linkedInitiatives = initiatives.filter(i => i.objective_id === obj.id)
    if (linkedInitiatives.length === 0 && obj.status === 'active') {
      insights.push({
        id: genAIId('alignment'),
        category: 'recommendation',
        severity: 'warning',
        title: `"${obj.title}" has no linked initiatives`,
        description: 'Active strategic objectives should have at least one initiative driving progress.',
        confidence: 'high',
        confidenceScore: 90,
        suggestedAction: 'Create or link initiatives to this objective.',
        module: 'strategy',
      })
    }
  }

  // Check for stalled initiatives
  const stalled = initiatives.filter(i => i.status === 'in_progress' && i.progress < 10 && i.start_date && daysBetween(i.start_date, new Date().toISOString().split('T')[0]) > 30)
  for (const init of stalled) {
    insights.push({
      id: genAIId('stalled-init'),
      category: 'alert',
      severity: 'warning',
      title: `Initiative "${init.title}" may be stalled`,
      description: `Started over 30 days ago but only at ${init.progress}% progress.`,
      confidence: 'medium',
      confidenceScore: 70,
      suggestedAction: 'Review blockers and resource allocation.',
      module: 'strategy',
    })
  }

  return insights
}

export function forecastKPITrend(kpi: any, measurements: any[]): AIInsight | null {
  if (measurements.length < 2) return null

  const sorted = [...measurements].sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
  const latest = sorted[sorted.length - 1].value
  const previous = sorted[sorted.length - 2].value
  const change = latest - previous
  const pctChange = previous !== 0 ? Math.round((change / previous) * 100) : 0

  const onTrack = kpi.target_value ? (latest / kpi.target_value) >= 0.7 : true
  const direction = change > 0 ? 'improving' : change < 0 ? 'declining' : 'flat'

  return {
    id: genAIId('kpi-trend'),
    category: 'trend',
    severity: !onTrack ? 'warning' : 'positive',
    title: `${kpi.name}: ${direction}`,
    description: `Current: ${latest} ${kpi.unit || ''} (${pctChange >= 0 ? '+' : ''}${pctChange}% vs last period). Target: ${kpi.target_value || 'N/A'} ${kpi.unit || ''}.`,
    confidence: measurements.length >= 3 ? 'high' : 'medium',
    confidenceScore: measurements.length >= 3 ? 80 : 60,
    suggestedAction: !onTrack ? 'Review action plan to close the gap to target.' : undefined,
    module: 'strategy',
  }
}

// ============================================================
// PHASE 3: WORKFLOW STUDIO AI
// ============================================================

export function analyzeWorkflowEfficiency(workflow: any, steps: any[], runs: any[]): AIScore {
  if (runs.length === 0) return { value: 50, label: 'No runs', trend: 'stable' }

  const completed = runs.filter(r => r.status === 'completed')
  const failed = runs.filter(r => r.status === 'failed')
  const successRate = pct(completed.length, runs.length)

  // Average completion time (for completed runs with both timestamps)
  const durations = completed
    .filter(r => r.started_at && r.completed_at)
    .map(r => new Date(r.completed_at).getTime() - new Date(r.started_at).getTime())
  const avgDuration = durations.length > 0 ? mean(durations) : 0
  const durationScore = avgDuration < 300000 ? 90 : avgDuration < 3600000 ? 70 : 50 // <5min=90, <1hr=70

  const stepEfficiency = steps.length > 0 && steps.length <= 7 ? 85 : steps.length > 10 ? 50 : 70

  const factors = [
    { factor: 'Success Rate', score: Math.round(successRate), weight: 0.40 },
    { factor: 'Execution Speed', score: Math.round(durationScore), weight: 0.30 },
    { factor: 'Step Efficiency', score: stepEfficiency, weight: 0.30 },
  ]

  const value = Math.round(factors.reduce((sum, f) => sum + f.score * f.weight, 0))
  const label = value >= 75 ? 'Efficient' : value >= 50 ? 'Moderate' : 'Needs Optimization'
  const trend = failed.length > completed.length * 0.3 ? 'down' as const : 'up' as const

  return { value: clamp(value, 0, 100), label, breakdown: factors, trend }
}

export function suggestWorkflowOptimizations(workflow: any, steps: any[], runs: any[]): AIRecommendation[] {
  const recs: AIRecommendation[] = []

  const failed = runs.filter(r => r.status === 'failed')
  if (failed.length > 0 && runs.length > 0) {
    const failRate = pct(failed.length, runs.length)
    if (failRate > 20) {
      recs.push({
        id: genAIId('wf-failrate'),
        title: 'High failure rate detected',
        rationale: `${Math.round(failRate)}% of runs have failed. Review error patterns and add error handling steps.`,
        impact: failRate > 40 ? 'high' : 'medium',
        effort: 'medium',
        category: 'workflow',
      })
    }
  }

  if (steps.length > 8) {
    recs.push({
      id: genAIId('wf-complexity'),
      title: 'Consider simplifying workflow',
      rationale: `${steps.length} steps may be too complex. Split into sub-workflows for maintainability.`,
      impact: 'medium',
      effort: 'high',
      category: 'workflow',
    })
  }

  const hasCondition = steps.some(s => s.step_type === 'condition')
  if (!hasCondition && steps.length > 3) {
    recs.push({
      id: genAIId('wf-condition'),
      title: 'Add conditional branching',
      rationale: 'Workflow runs linearly without conditions. Adding conditions could handle edge cases.',
      impact: 'low',
      effort: 'low',
      category: 'workflow',
    })
  }

  return recs
}

export function predictWorkflowFailure(workflow: any, runs: any[]): AIInsight | null {
  if (runs.length < 3) return null

  const recent = runs.slice(-5)
  const recentFails = recent.filter(r => r.status === 'failed').length

  if (recentFails >= 2) {
    return {
      id: genAIId('wf-fail-predict'),
      category: 'prediction',
      severity: recentFails >= 3 ? 'critical' : 'warning',
      title: 'Recurring workflow failures',
      description: `${recentFails} of the last ${recent.length} runs have failed. Pattern suggests a systemic issue.`,
      confidence: recentFails >= 3 ? 'high' : 'medium',
      confidenceScore: recentFails >= 3 ? 85 : 65,
      suggestedAction: 'Investigate common failure context and add retry logic or error notifications.',
      module: 'workflow-studio',
    }
  }
  return null
}

// ============================================================
// PHASE 4: COURSE, LEARNING PATH, CAREER SITE & JOB BOARD AI
// ============================================================

export interface CourseOutline {
  title: string
  description: string
  modules: Array<{
    title: string
    lessons: string[]
    duration_minutes: number
  }>
  total_duration_hours: number
  level: string
}

export function generateCourseOutline(topic: string, level: string, durationHours: number): CourseOutline {
  // Simple deterministic hash
  const hash = topic.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)

  const moduleCount = clamp(Math.floor(durationHours / 3) + 1, 3, 8)
  const lessonsPerModule = level === 'advanced' ? 4 : level === 'intermediate' ? 3 : 2

  const moduleTopics = [
    'Introduction & Foundations', 'Core Concepts', 'Practical Application',
    'Advanced Techniques', 'Case Studies', 'Best Practices',
    'Tools & Frameworks', 'Assessment & Certification'
  ]

  const lessonSuffixes = [
    'Overview', 'Key Principles', 'Hands-on Exercise', 'Discussion',
    'Deep Dive', 'Real-world Examples', 'Workshop', 'Quiz & Review'
  ]

  const modules = Array.from({ length: moduleCount }, (_, i) => ({
    title: `Module ${i + 1}: ${moduleTopics[(hash + i) % moduleTopics.length]}`,
    lessons: Array.from({ length: lessonsPerModule }, (_, j) =>
      `${topic} - ${lessonSuffixes[(hash + i + j) % lessonSuffixes.length]}`
    ),
    duration_minutes: Math.round((durationHours * 60) / moduleCount),
  }))

  return {
    title: `${topic} - ${level.charAt(0).toUpperCase() + level.slice(1)} Course`,
    description: `A comprehensive ${level} course on ${topic} designed for professional development.`,
    modules,
    total_duration_hours: durationHours,
    level,
  }
}

export function suggestLearningPathOrder(
  courses: Array<{ id: string; title: string; level: string; duration_hours: number }>,
  enrollments: Array<{ course_id: string; status: string; progress: number }>
): Array<{ courseId: string; title: string; reason: string; priority: number }> {
  const levelOrder: Record<string, number> = { beginner: 1, intermediate: 2, advanced: 3 }

  return courses
    .map(c => {
      const enrollment = enrollments.find(e => e.course_id === c.id)
      const isComplete = enrollment?.status === 'completed'
      const isInProgress = enrollment?.status === 'in_progress'

      let priority = levelOrder[c.level] || 2
      if (isComplete) priority += 10 // push completed to end
      if (isInProgress) priority -= 0.5 // prioritize in-progress

      const reason = isComplete
        ? 'Already completed'
        : isInProgress
          ? `Continue from ${enrollment?.progress || 0}%`
          : `Start ${c.level} content`

      return { courseId: c.id, title: c.title, reason, priority }
    })
    .sort((a, b) => a.priority - b.priority)
}

export function scoreCareerSiteEffectiveness(config: {
  enabled: boolean
  hero_title: string
  hero_subtitle: string
  sections: string[]
  theme: string
}): AIScore {
  const factors: Array<{ factor: string; score: number; weight: number }> = []

  // Enabled
  factors.push({ factor: 'Active', score: config.enabled ? 100 : 0, weight: 0.15 })

  // Hero content quality
  const titleQuality = clamp((config.hero_title?.length || 0) * 3, 0, 100)
  factors.push({ factor: 'Hero Title', score: titleQuality, weight: 0.2 })

  const subtitleQuality = clamp((config.hero_subtitle?.length || 0) * 1.5, 0, 100)
  factors.push({ factor: 'Hero Subtitle', score: subtitleQuality, weight: 0.15 })

  // Sections completeness
  const allSections = ['about', 'benefits', 'positions', 'team', 'testimonials']
  const sectionScore = pct(config.sections?.length || 0, allSections.length)
  factors.push({ factor: 'Content Sections', score: sectionScore, weight: 0.25 })

  // Theme set
  factors.push({ factor: 'Branding', score: config.theme ? 85 : 30, weight: 0.25 })

  const total = Math.round(factors.reduce((sum, f) => sum + f.score * f.weight, 0))

  return {
    value: total,
    label: total >= 80 ? 'Excellent' : total >= 60 ? 'Good' : total >= 40 ? 'Needs Work' : 'Incomplete',
    breakdown: factors,
    trend: 'stable',
  }
}

export interface JobBoardRecommendation {
  id: string
  name: string
  score: number
  reason: string
  recommended: boolean
}

export function recommendJobBoards(jobPosting: {
  title: string
  type: string
  salary_min?: number
  salary_max?: number
  department_id?: string
  location?: string
}): JobBoardRecommendation[] {
  const title = (jobPosting.title || '').toLowerCase()
  const isTech = /engineer|developer|designer|data|devops|ux|product/i.test(title)
  const isSenior = /senior|lead|head|director|vp|chief|cto|cfo/i.test(title)
  const isContract = jobPosting.type === 'contract'

  const boards: JobBoardRecommendation[] = [
    {
      id: 'linkedin',
      name: 'LinkedIn',
      score: 92,
      reason: 'Best reach for professional roles across Africa',
      recommended: true,
    },
    {
      id: 'indeed',
      name: 'Indeed',
      score: 85,
      reason: 'High volume job board with strong African presence',
      recommended: true,
    },
    {
      id: 'glassdoor',
      name: 'Glassdoor',
      score: isSenior ? 82 : 68,
      reason: isSenior ? 'Senior candidates research companies on Glassdoor' : 'Good for employer branding',
      recommended: isSenior,
    },
    {
      id: 'google_jobs',
      name: 'Google Jobs',
      score: 78,
      reason: 'Free distribution through Google search results',
      recommended: true,
    },
    {
      id: 'ziprecruiter',
      name: 'ZipRecruiter',
      score: isContract ? 75 : 60,
      reason: isContract ? 'Strong for contract/freelance roles' : 'General job board',
      recommended: isContract,
    },
    {
      id: 'angellist',
      name: 'AngelList',
      score: isTech ? 88 : 45,
      reason: isTech ? 'Top board for tech talent and startups' : 'Primarily tech-focused audience',
      recommended: isTech,
    },
    {
      id: 'career_site',
      name: 'Company Career Site',
      score: 95,
      reason: 'Direct applications with no middleman fees',
      recommended: true,
    },
  ]

  return boards.sort((a, b) => b.score - a.score)
}
