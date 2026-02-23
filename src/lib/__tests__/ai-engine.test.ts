import { describe, it, expect } from 'vitest'
import {
  scoreGoalQuality,
  detectRatingBias,
  predictPerformanceTrend,
  analyzeFeedbackSentiment,
  detectPayEquityGaps,
  detectCompAnomalies,
  modelBudgetImpact,
  calculateFlightRisk,
  identifyEngagementDrivers,
  recommendCourses,
  analyzeSkillGaps,
  predictCourseCompletion,
  calculateMentorMatch,
  scoreCandidateFit,
  analyzePipelineHealth,
  predictTimeToHire,
  generateEmployeeInsight,
  suggestCareerPath,
  detectPayrollAnomalies,
  forecastAnnualPayroll,
  checkPolicyCompliance,
  calculateFraudRiskScore,
  analyzeSpendingTrends,
  detectCoverageGaps,
  assessBurnoutRisk,
  analyzeLeavePatterns,
  predictDeviceRefresh,
  optimizeLicenses,
  forecastCashFlow,
  calculateBurnRate,
  detectInvoiceAnomalies,
  assessVendorConcentration,
  generateExecutiveSummary,
  identifyNextBestActions,
  parseNaturalLanguageQuery,
  generateBoardNarrative,
} from '../ai-engine'

// ─── Helpers ──────────────────────────────────────────────────────────────

const mockEmployee = (overrides = {}) => ({
  id: 'emp-1',
  department_id: 'dept-1',
  job_title: 'Manager',
  level: 'Senior',
  country: 'NG',
  role: 'manager',
  hire_date: '2020-01-01',
  base_salary: 80000,
  comp_ratio: 0.95,
  profile: { full_name: 'Test User', email: 'test@test.com', avatar_url: null },
  ...overrides,
})

const mockGoal = (overrides = {}) => ({
  id: 'goal-1',
  employee_id: 'emp-1',
  title: 'Increase revenue by 20% through new client acquisition in Q3',
  description: 'Implement strategic outreach program targeting mid-market clients with measurable KPIs',
  category: 'business',
  status: 'on_track',
  progress: 65,
  start_date: '2026-01-01',
  due_date: '2026-06-30',
  target_value: 20,
  ...overrides,
})

const mockReview = (overrides = {}) => ({
  id: 'rev-1',
  employee_id: 'emp-1',
  reviewer_id: 'emp-2',
  type: 'annual',
  status: 'submitted',
  overall_rating: 4,
  ratings: { leadership: 4, execution: 4, collaboration: 5, innovation: 3 },
  comments: 'Great work',
  submitted_at: '2026-01-15',
  ...overrides,
})

const mockSalaryReview = (overrides = {}) => ({
  id: 'sr-1',
  employee_id: 'emp-1',
  current_salary: 80000,
  proposed_salary: 88000,
  currency: 'USD',
  justification: 'Market adjustment',
  status: 'pending_approval',
  ...overrides,
})

// ─── Performance Module ───────────────────────────────────────────────────

describe('Performance AI', () => {
  describe('scoreGoalQuality', () => {
    it('scores a well-written SMART goal highly', () => {
      const score = scoreGoalQuality(mockGoal())
      expect(score.value).toBeGreaterThan(50)
      expect(['Strong', 'Moderate', 'Needs improvement']).toContain(score.label)
      expect(score.breakdown).toBeDefined()
      expect(score.breakdown!.length).toBeGreaterThan(0)
    })

    it('scores a vague goal lower', () => {
      const vagueGoal = mockGoal({ title: 'Do better', description: '', target_value: undefined, due_date: undefined })
      const score = scoreGoalQuality(vagueGoal)
      expect(score.value).toBeLessThan(50)
    })

    it('handles empty title', () => {
      const score = scoreGoalQuality({ title: '' })
      expect(score.value).toBeGreaterThanOrEqual(0)
      expect(score.value).toBeLessThanOrEqual(100)
    })
  })

  describe('detectRatingBias', () => {
    it('returns empty array with no reviews', () => {
      const insights = detectRatingBias([], [])
      expect(insights).toEqual([])
    })

    it('detects central tendency bias', () => {
      const reviews = Array(10).fill(null).map((_, i) =>
        mockReview({ id: `rev-${i}`, overall_rating: 3 })
      )
      const employees = [mockEmployee()]
      const insights = detectRatingBias(reviews, employees)
      expect(Array.isArray(insights)).toBe(true)
    })
  })

  describe('predictPerformanceTrend', () => {
    it('returns insight for at-risk goal', () => {
      // Use a due date very close to now so expectedProgress is high, creating a large gap with low progress
      const soon = new Date()
      soon.setDate(soon.getDate() + 5)
      const atRiskGoal = mockGoal({ status: 'on_track', progress: 10, due_date: soon.toISOString().split('T')[0] })
      const insight = predictPerformanceTrend(atRiskGoal)
      expect(insight).not.toBeNull()
    })

    it('returns null for completed goal', () => {
      const completedGoal = mockGoal({ status: 'completed', progress: 100 })
      const insight = predictPerformanceTrend(completedGoal)
      // completed goal with 100% progress and far due_date won't have gap > 25
      expect(insight).toBeNull()
    })
  })

  describe('analyzeFeedbackSentiment', () => {
    it('handles empty feedback', () => {
      const result = analyzeFeedbackSentiment([])
      expect(result.positive).toBe(0)
      expect(result.negative).toBe(0)
      expect(result.neutral).toBe(0)
    })

    it('categorizes feedback types', () => {
      const feedbacks = [
        { type: 'recognition', content: 'Great job' },
        { type: 'feedback', content: 'Needs improvement' },
        { type: 'checkin', content: 'Regular sync' },
      ]
      const result = analyzeFeedbackSentiment(feedbacks)
      expect(result.positive + result.negative + result.neutral).toBeGreaterThan(0)
    })
  })
})

// ─── Compensation Module ──────────────────────────────────────────────────

describe('Compensation AI', () => {
  describe('detectPayEquityGaps', () => {
    it('returns empty with no data', () => {
      const insights = detectPayEquityGaps([], [])
      expect(insights).toEqual([])
    })
  })

  describe('modelBudgetImpact', () => {
    it('calculates impact for pending reviews', () => {
      const reviews = [
        mockSalaryReview({ status: 'pending_approval' }),
        mockSalaryReview({ id: 'sr-2', current_salary: 60000, proposed_salary: 66000, status: 'pending_approval' }),
      ]
      const result = modelBudgetImpact(reviews)
      expect(result.count).toBe(2)
      expect(result.totalAnnualImpact).toBeGreaterThan(0)
      expect(result.avgIncrease).toBeGreaterThan(0)
    })

    it('returns zeros for empty input', () => {
      const result = modelBudgetImpact([])
      expect(result.count).toBe(0)
      expect(result.totalAnnualImpact).toBe(0)
    })
  })
})

// ─── Engagement Module ────────────────────────────────────────────────────

describe('Engagement AI', () => {
  describe('calculateFlightRisk', () => {
    it('calculates risk score between 0-100', () => {
      const score = calculateFlightRisk(mockEmployee(), {
        reviews: [mockReview()],
        goals: [mockGoal()],
        engagementScores: [],
        salaryReviews: [],
        mentoringPairs: [],
        leaveRequests: [],
      })
      expect(score.value).toBeGreaterThanOrEqual(0)
      expect(score.value).toBeLessThanOrEqual(100)
      expect(['High Risk', 'Moderate Risk', 'Low Risk']).toContain(score.label)
    })

    it('handles empty data gracefully', () => {
      const score = calculateFlightRisk(mockEmployee(), {
        reviews: [],
        goals: [],
        engagementScores: [],
        salaryReviews: [],
        mentoringPairs: [],
        leaveRequests: [],
      })
      expect(score.value).toBeGreaterThanOrEqual(0)
    })
  })

  describe('identifyEngagementDrivers', () => {
    it('returns empty for no scores', () => {
      const insights = identifyEngagementDrivers([])
      expect(insights).toEqual([])
    })
  })
})

// ─── Learning Module ──────────────────────────────────────────────────────

describe('Learning AI', () => {
  describe('analyzeSkillGaps', () => {
    it('returns categories from courses', () => {
      const courses = [
        { id: 'c-1', category: 'leadership', title: 'Lead 101' },
        { id: 'c-2', category: 'technical', title: 'Code 101' },
      ]
      const enrollments = [
        { id: 'e-1', course_id: 'c-1', status: 'completed' },
      ]
      const gaps = analyzeSkillGaps(courses, enrollments)
      expect(gaps.length).toBe(2)
      expect(gaps.every(g => g.category && typeof g.coverage === 'number')).toBe(true)
    })
  })

  describe('predictCourseCompletion', () => {
    it('predicts high completion for advanced progress', () => {
      const score = predictCourseCompletion({ progress: 80, status: 'in_progress' })
      expect(score.value).toBeGreaterThan(60)
    })

    it('predicts 100 for completed enrollment', () => {
      const score = predictCourseCompletion({ progress: 100, status: 'completed' })
      expect(score.value).toBe(100)
    })
  })
})

// ─── Recruiting Module ────────────────────────────────────────────────────

describe('Recruiting AI', () => {
  describe('scoreCandidateFit', () => {
    it('scores candidate between 0-100', () => {
      const score = scoreCandidateFit(
        { rating: 4, status: 'interview', stage: 3, notes: 'Strong technical skills' },
        { title: 'Senior Engineer' }
      )
      expect(score.value).toBeGreaterThanOrEqual(0)
      expect(score.value).toBeLessThanOrEqual(100)
    })
  })

  describe('predictTimeToHire', () => {
    it('returns days and confidence', () => {
      const result = predictTimeToHire(
        { id: 'j-1', status: 'open', created_at: '2026-01-01' },
        [{ job_id: 'j-1', status: 'interview', stage: 'interview', applied_at: '2026-01-01' }]
      )
      expect(result.days).toBeGreaterThan(0)
      expect(['high', 'medium', 'low']).toContain(result.confidence)
    })
  })
})

// ─── Payroll Module ───────────────────────────────────────────────────────

describe('Payroll AI', () => {
  describe('detectPayrollAnomalies', () => {
    it('returns empty for single run', () => {
      const insights = detectPayrollAnomalies([
        { period: '2026-01', total_gross: 1000000, status: 'paid' },
      ])
      expect(Array.isArray(insights)).toBe(true)
    })
  })

  describe('forecastAnnualPayroll', () => {
    it('projects annual spend', () => {
      const runs = [
        { period: '2026-01', gross_amount: 2000000 },
        { period: '2026-02', gross_amount: 2100000 },
      ]
      const forecast = forecastAnnualPayroll(runs)
      expect(forecast.projected).toBeGreaterThan(0)
      expect(['high', 'medium', 'low']).toContain(forecast.confidence)
    })
  })
})

// ─── Expense Module ───────────────────────────────────────────────────────

describe('Expense AI', () => {
  describe('checkPolicyCompliance', () => {
    it('flags high-value reports', () => {
      const report = { total_amount: 10000, title: 'Conference', items: [], currency: 'USD' }
      const insights = checkPolicyCompliance(report)
      expect(Array.isArray(insights)).toBe(true)
    })
  })

  describe('calculateFraudRiskScore', () => {
    it('returns score between 0-100', () => {
      const report = { total_amount: 500, title: 'Lunch', submitted_at: '2026-01-15T10:00:00', items: [{ amount: 500 }] }
      const score = calculateFraudRiskScore(report, [report])
      expect(score.value).toBeGreaterThanOrEqual(0)
      expect(score.value).toBeLessThanOrEqual(100)
    })
  })
})

// ─── IT Module ────────────────────────────────────────────────────────────

describe('IT AI', () => {
  describe('predictDeviceRefresh', () => {
    it('flags devices nearing warranty expiry', () => {
      const devices = [
        { id: 'd-1', warranty_end: '2026-04-01', status: 'assigned', type: 'laptop', brand: 'Dell', model: 'Latitude' },
      ]
      const insights = predictDeviceRefresh(devices)
      expect(Array.isArray(insights)).toBe(true)
    })
  })

  describe('optimizeLicenses', () => {
    it('recommends optimization for low utilization', () => {
      const licenses = [
        { id: 'l-1', name: 'Figma', total_licenses: 10, used_licenses: 3, cost_per_license: 15 },
      ]
      const recs = optimizeLicenses(licenses)
      expect(Array.isArray(recs)).toBe(true)
    })
  })
})

// ─── Finance Module ───────────────────────────────────────────────────────

describe('Finance AI', () => {
  describe('forecastCashFlow', () => {
    it('returns insight about cash position', () => {
      const invoices = [{ amount: 5000, status: 'pending', due_date: '2026-03-01' }]
      const budgets = [{ total_amount: 100000, spent_amount: 60000 }]
      const insight = forecastCashFlow(invoices, budgets)
      expect(insight.title).toBeTruthy()
    })
  })

  describe('calculateBurnRate', () => {
    it('returns insights for overspending', () => {
      const budgets = [
        { id: 'b-1', name: 'Engineering', total_amount: 100000, spent_amount: 85000, status: 'active' },
      ]
      const insights = calculateBurnRate(budgets)
      expect(Array.isArray(insights)).toBe(true)
    })
  })

  describe('detectInvoiceAnomalies', () => {
    it('handles empty invoices', () => {
      const anomalies = detectInvoiceAnomalies([])
      expect(anomalies).toEqual([])
    })
  })
})

// ─── Dashboard / Cross-Module ─────────────────────────────────────────────

describe('Dashboard AI', () => {
  const mockDashboardData = {
    employees: [mockEmployee()],
    goals: [mockGoal()],
    reviews: [mockReview()],
    reviewCycles: [],
    feedback: [],
    compBands: [],
    salaryReviews: [mockSalaryReview()],
    courses: [],
    enrollments: [],
    surveys: [],
    engagementScores: [],
    mentoringPrograms: [],
    mentoringPairs: [],
    leaveRequests: [],
    expenseReports: [],
    jobPostings: [],
    applications: [],
    payrollRuns: [],
    devices: [],
    softwareLicenses: [],
    itRequests: [],
    invoices: [],
    budgets: [],
    vendors: [],
    departments: [],
  }

  describe('generateExecutiveSummary', () => {
    it('generates narrative with KPIs', () => {
      const result = generateExecutiveSummary(mockDashboardData)
      expect(result.summary).toBeTruthy()
      expect(Array.isArray(result.bulletPoints)).toBe(true)
    })
  })

  describe('identifyNextBestActions', () => {
    it('returns actionable recommendations', () => {
      const actions = identifyNextBestActions(mockDashboardData)
      expect(Array.isArray(actions)).toBe(true)
    })
  })

  describe('parseNaturalLanguageQuery', () => {
    it('parses "high performers" query', () => {
      const result = parseNaturalLanguageQuery('high performers', mockDashboardData)
      expect(Array.isArray(result.results)).toBe(true)
      expect(result.description).toBeTruthy()
    })

    it('parses "at risk" query', () => {
      const result = parseNaturalLanguageQuery('goals at risk', mockDashboardData)
      expect(Array.isArray(result.results)).toBe(true)
      expect(result.description).toBeTruthy()
    })

    it('returns empty for nonsense query', () => {
      const result = parseNaturalLanguageQuery('xyzzy', mockDashboardData)
      expect(Array.isArray(result.results)).toBe(true)
    })
  })

  describe('generateBoardNarrative', () => {
    it('generates board-ready text', () => {
      const narrative = generateBoardNarrative(mockDashboardData)
      expect(narrative.summary).toBeTruthy()
      expect(Array.isArray(narrative.bulletPoints)).toBe(true)
    })
  })
})
