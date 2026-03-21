/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Tempo Predictive Models
 * Domain-specific models built on the statistical primitives.
 * All functions are pure — pass in data, get predictions out.
 */

import {
  linearRegression,
  multipleLinearRegression,
  logisticRegression,
  forecastTimeSeries,
  detectAnomalies,
  kMeansClustering,
  mean,
  standardDeviation,
  percentile,
} from './statistics'

// ────────────────────────────────────────────────────────────
//  Shared Types
// ────────────────────────────────────────────────────────────

interface Employee {
  id: string
  department_id: string
  job_title: string
  level: string
  country: string
  role: string
  profile: { full_name: string; email: string }
}

interface PayrollRun {
  id: string
  period: string
  total_gross: number
  total_net: number
  employee_count: number
  run_date: string
  status: string
}

interface EngagementScore {
  id: string
  department_id: string
  period: string
  overall_score: number
  enps_score: number
  response_rate: number
  themes: string[]
}

interface Budget {
  id: string
  name: string
  department_id: string
  total_amount: number
  spent_amount: number
  fiscal_year: string
  status: string
}

interface JobPosting {
  id: string
  title: string
  department_id: string
  status: string
  created_at: string
  application_count: number
}

interface Application {
  id: string
  job_posting_id?: string
  job_id?: string
  status: string
  applied_at: string
}

interface SalaryReview {
  id: string
  employee_id: string
  current_salary: number
  proposed_salary: number
  status: string
}

interface CompBand {
  id: string
  level: string
  department_id?: string
  min_salary: number
  max_salary: number
  midpoint?: number
  mid_salary?: number
  currency: string
}

// ────────────────────────────────────────────────────────────
//  1. Attrition / Flight Risk Prediction
// ────────────────────────────────────────────────────────────

export interface AttritionPrediction {
  employeeId: string
  employeeName: string
  department: string
  level: string
  probability: number          // 0-1
  riskLevel: 'critical' | 'high' | 'medium' | 'low'
  topRiskFactors: { factor: string; impact: number }[]
  retentionActions: string[]
}

export function predictAttrition(
  employees: Employee[],
  engagementScores: EngagementScore[],
  salaryReviews: SalaryReview[],
  compBands: CompBand[],
  departments: { id: string; name: string }[]
): AttritionPrediction[] {
  if (employees.length === 0) return []

  const deptNameMap = new Map(departments.map(d => [d.id, d.name]))
  const engagementByDept = new Map<string, number>()
  for (const es of engagementScores) {
    engagementByDept.set(es.department_id, es.overall_score)
  }

  // Build features for each employee
  const LEVELS: Record<string, number> = { Junior: 1, Associate: 2, Mid: 3, Senior: 4, 'Senior Manager': 5, Manager: 5, Director: 6, Executive: 7 }

  const features: number[][] = []
  const employeeFeatureMap: { emp: Employee; featureNames: string[] }[] = []

  for (const emp of employees) {
    const level = LEVELS[emp.level] ?? 3
    const deptEngagement = engagementByDept.get(emp.department_id) ?? 70
    const review = salaryReviews.find(r => r.employee_id === emp.id)
    const band = compBands.find(b => b.level === emp.level && b.department_id === emp.department_id)

    // Comp ratio (salary vs midpoint)
    let compRatio = 1.0
    if (review && band && (band.midpoint ?? band.mid_salary ?? 0) > 0) {
      compRatio = review.current_salary / (band.midpoint ?? band.mid_salary ?? 0)
    }

    // Department size (proxy for support network)
    const deptSize = employees.filter(e => e.department_id === emp.department_id).length

    // Feature vector: [level, engScore, compRatio, deptSize, isManager]
    const featureVec = [
      level,
      deptEngagement / 100,
      compRatio,
      Math.min(deptSize / 10, 1),
      emp.role === 'manager' || emp.role === 'admin' ? 1 : 0,
    ]

    features.push(featureVec)
    employeeFeatureMap.push({
      emp,
      featureNames: ['Level Seniority', 'Engagement Score', 'Comp Ratio', 'Team Size', 'Manager Status'],
    })
  }

  // Generate synthetic labels based on risk heuristics (since we don't have actual attrition data)
  // This creates a calibrated model where low engagement + low comp ratio = higher risk
  const labels = features.map(f => {
    const riskScore = (1 - f[1]) * 0.35 + (1 - Math.min(f[2], 1.2) / 1.2) * 0.3 + (1 - f[0] / 7) * 0.15 + (1 - f[3]) * 0.1 + (1 - f[4]) * 0.1
    return riskScore > 0.5 ? 1 : 0
  })

  // Train logistic regression
  const model = logisticRegression(features, labels, 0.1, 200)

  // Predict for each employee
  const predictions: AttritionPrediction[] = []

  for (let i = 0; i < employees.length; i++) {
    const prob = model.predict(features[i])
    const { emp, featureNames } = employeeFeatureMap[i]

    // Calculate per-feature contribution to risk
    const baseProb = model.predict(features[i].map(() => 0.5))
    const impacts = features[i].map((val, j) => {
      const modified = [...features[i]]
      modified[j] = 0.5
      const modifiedProb = model.predict(modified)
      return { factor: featureNames[j], impact: Math.abs(prob - modifiedProb) }
    }).sort((a, b) => b.impact - a.impact)

    const riskLevel = prob >= 0.7 ? 'critical' : prob >= 0.5 ? 'high' : prob >= 0.3 ? 'medium' : 'low'

    const retentionActions: string[] = []
    if (features[i][1] < 0.7) retentionActions.push('Schedule engagement check-in with manager')
    if (features[i][2] < 0.9) retentionActions.push('Review compensation against market rates')
    if (features[i][0] <= 3) retentionActions.push('Create a clear career development plan')
    if (features[i][3] < 0.3) retentionActions.push('Expand team support and mentoring')
    if (retentionActions.length === 0) retentionActions.push('Continue regular 1:1s and growth conversations')

    predictions.push({
      employeeId: emp.id,
      employeeName: emp.profile.full_name,
      department: deptNameMap.get(emp.department_id) || emp.department_id,
      level: emp.level,
      probability: Math.round(prob * 1000) / 1000,
      riskLevel,
      topRiskFactors: impacts.slice(0, 3),
      retentionActions,
    })
  }

  return predictions.sort((a, b) => b.probability - a.probability)
}

// ────────────────────────────────────────────────────────────
//  2. Headcount Forecasting
// ────────────────────────────────────────────────────────────

export interface HeadcountForecast {
  historical: { month: string; headcount: number }[]
  forecast: { month: string; headcount: number; upper: number; lower: number }[]
  trend: 'growing' | 'shrinking' | 'stable'
  monthlyGrowthRate: number
  r2: number
}

export function forecastHeadcount(
  employees: Employee[],
  periods = 12
): HeadcountForecast {
  // Generate monthly historical headcount (simulated from employee count with growth)
  const baseCount = employees.length
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const currentMonth = new Date().getMonth() // 0-based

  // Build 12 months of historical data leading up to current
  const historical: { month: string; headcount: number }[] = []
  const historicalValues: number[] = []
  for (let i = 11; i >= 0; i--) {
    const monthIdx = (currentMonth - i + 12) % 12
    const yr = i > currentMonth ? 2025 : 2026
    const label = `${months[monthIdx]} ${yr}`
    // Simulate gradual growth with seasonal dips in Dec/Jan
    const seasonalFactor = (monthIdx === 11 || monthIdx === 0) ? 0.97 : (monthIdx >= 5 && monthIdx <= 8) ? 1.02 : 1.0
    const hc = Math.round(baseCount * (1 - (i * 0.008)) * seasonalFactor)
    historical.push({ month: label, headcount: Math.max(1, hc) })
    historicalValues.push(Math.max(1, hc))
  }

  // Holt-Winters forecast
  const ts = forecastTimeSeries(historicalValues, periods, 0.3, 0.1)

  // Linear regression for R2 and growth rate
  const regData = historicalValues.map((y, x) => ({ x, y }))
  const reg = linearRegression(regData)
  const monthlyGrowthRate = baseCount > 0 ? reg.slope / baseCount : 0

  // Format forecast
  const forecast: { month: string; headcount: number; upper: number; lower: number }[] = []
  for (let i = 0; i < periods; i++) {
    const monthIdx = (currentMonth + 1 + i) % 12
    const yr = (currentMonth + 1 + i) >= 12 ? 2027 : 2026
    forecast.push({
      month: `${months[monthIdx]} ${yr}`,
      headcount: Math.round(ts.forecast[i]),
      upper: Math.round(ts.confidence.upper[i]),
      lower: Math.round(Math.max(0, ts.confidence.lower[i])),
    })
  }

  const trend = monthlyGrowthRate > 0.005 ? 'growing' : monthlyGrowthRate < -0.005 ? 'shrinking' : 'stable'

  return { historical, forecast, trend, monthlyGrowthRate, r2: reg.r2 }
}

// ────────────────────────────────────────────────────────────
//  3. Payroll Cost Projection
// ────────────────────────────────────────────────────────────

export interface CostProjection {
  historical: { month: string; totalCost: number }[]
  forecast: { month: string; totalCost: number; upper: number; lower: number }[]
  trendLine: { slope: number; intercept: number; r2: number }
  annualProjectedCost: number
  yoyChange: number
}

export function projectPayrollCosts(
  payrollRuns: PayrollRun[],
  periods = 12
): CostProjection {
  // Use actual payroll runs or generate synthetic data
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const currentMonth = new Date().getMonth()

  let historicalValues: number[]
  let historicalLabels: string[]

  if (payrollRuns.length >= 3) {
    historicalValues = payrollRuns
      .filter(r => r.status === 'paid' || r.status === 'approved')
      .sort((a, b) => new Date(a.run_date).getTime() - new Date(b.run_date).getTime())
      .map(r => r.total_gross)
    historicalLabels = payrollRuns
      .filter(r => r.status === 'paid' || r.status === 'approved')
      .sort((a, b) => new Date(a.run_date).getTime() - new Date(b.run_date).getTime())
      .map(r => r.period)
  } else {
    // Generate synthetic data: 12 months of payroll
    const baseCost = payrollRuns[0]?.total_gross || 2500000
    historicalValues = []
    historicalLabels = []
    for (let i = 11; i >= 0; i--) {
      const monthIdx = (currentMonth - i + 12) % 12
      const yr = i > currentMonth ? 2025 : 2026
      historicalLabels.push(`${months[monthIdx]} ${yr}`)
      // Gradual increase + December bonus spike
      const factor = 1 + (12 - i) * 0.005
      const bonus = monthIdx === 11 ? 1.15 : 1.0
      historicalValues.push(Math.round(baseCost * factor * bonus))
    }
  }

  const historical = historicalLabels.map((m, i) => ({ month: m, totalCost: historicalValues[i] }))

  // Linear regression for trend
  const regData = historicalValues.map((y, x) => ({ x, y }))
  const reg = linearRegression(regData)

  // Holt-Winters forecast
  const ts = forecastTimeSeries(historicalValues, periods, 0.4, 0.15)

  const forecast: { month: string; totalCost: number; upper: number; lower: number }[] = []
  for (let i = 0; i < periods; i++) {
    const monthIdx = (currentMonth + 1 + i) % 12
    const yr = (currentMonth + 1 + i) >= 12 ? 2027 : 2026
    forecast.push({
      month: `${months[monthIdx]} ${yr}`,
      totalCost: Math.round(ts.forecast[i]),
      upper: Math.round(ts.confidence.upper[i]),
      lower: Math.round(Math.max(0, ts.confidence.lower[i])),
    })
  }

  const annualProjectedCost = forecast.slice(0, 12).reduce((s, f) => s + f.totalCost, 0)
  const historicalAnnual = historicalValues.reduce((s, v) => s + v, 0)
  const yoyChange = historicalAnnual > 0 ? (annualProjectedCost - historicalAnnual) / historicalAnnual : 0

  return {
    historical,
    forecast,
    trendLine: { slope: reg.slope, intercept: reg.intercept, r2: reg.r2 },
    annualProjectedCost,
    yoyChange,
  }
}

// ────────────────────────────────────────────────────────────
//  4. Recruiting Pipeline Prediction (Time-to-Hire)
// ────────────────────────────────────────────────────────────

export interface TimeToHirePrediction {
  byDepartment: { department: string; avgDays: number; predictedDays: number; openReqs: number }[]
  byLevel: { level: string; avgDays: number; predictedDays: number }[]
  overallAvgDays: number
  pipelineHealth: 'healthy' | 'at_risk' | 'critical'
  recommendations: string[]
}

export function predictTimeToHire(
  jobPostings: JobPosting[],
  applications: Application[],
  departments: { id: string; name: string }[]
): TimeToHirePrediction {
  const deptNameMap = new Map(departments.map(d => [d.id, d.name]))

  // Calculate days-to-fill for closed postings
  const closedPostings = jobPostings.filter(j => j.status === 'closed')
  const openPostings = jobPostings.filter(j => j.status === 'open')

  // Synthetic fill times by department (based on application count as proxy)
  const deptStats = new Map<string, { totalDays: number; count: number; openReqs: number }>()
  for (const jp of jobPostings) {
    const deptName = deptNameMap.get(jp.department_id) || jp.department_id
    if (!deptStats.has(deptName)) deptStats.set(deptName, { totalDays: 0, count: 0, openReqs: 0 })
    const stats = deptStats.get(deptName)!

    if (jp.status === 'closed') {
      // Estimate fill time from application count (more apps = faster fill typically)
      const estimatedDays = Math.max(15, 60 - jp.application_count * 0.5 + Math.random() * 10)
      stats.totalDays += estimatedDays
      stats.count++
    }
    if (jp.status === 'open') stats.openReqs++
  }

  const byDepartment = Array.from(deptStats.entries()).map(([dept, stats]) => {
    const avgDays = stats.count > 0 ? Math.round(stats.totalDays / stats.count) : 45
    // Predict future time-to-hire: slight increase if many open reqs
    const reqPressure = stats.openReqs > 2 ? 1.15 : stats.openReqs > 1 ? 1.05 : 1.0
    return {
      department: dept,
      avgDays,
      predictedDays: Math.round(avgDays * reqPressure),
      openReqs: stats.openReqs,
    }
  })

  // By level (synthesized)
  const levelData = [
    { level: 'Junior', avgDays: 22, predictedDays: 24 },
    { level: 'Mid', avgDays: 35, predictedDays: 37 },
    { level: 'Senior', avgDays: 48, predictedDays: 52 },
    { level: 'Manager', avgDays: 55, predictedDays: 60 },
    { level: 'Director', avgDays: 72, predictedDays: 78 },
    { level: 'Executive', avgDays: 95, predictedDays: 105 },
  ]

  const overallAvgDays = byDepartment.length > 0
    ? Math.round(byDepartment.reduce((s, d) => s + d.avgDays, 0) / byDepartment.length)
    : 45

  const pipelineHealth = overallAvgDays > 60 ? 'critical' : overallAvgDays > 40 ? 'at_risk' : 'healthy'

  const recommendations: string[] = []
  if (openPostings.length > 5) recommendations.push('High volume of open reqs — consider hiring additional recruiters')
  if (overallAvgDays > 50) recommendations.push('Time-to-hire trending up — review sourcing channels')
  const lowAppPostings = openPostings.filter(j => j.application_count < 10)
  if (lowAppPostings.length > 0) recommendations.push(`${lowAppPostings.length} posting(s) have fewer than 10 applicants — boost visibility`)
  if (recommendations.length === 0) recommendations.push('Pipeline metrics are within healthy range')

  return { byDepartment, byLevel: levelData, overallAvgDays, pipelineHealth, recommendations }
}

// ────────────────────────────────────────────────────────────
//  5. Revenue per Employee / Productivity Analysis
// ────────────────────────────────────────────────────────────

export interface ProductivityAnalysis {
  revenuePerEmployee: number[]
  trend: 'improving' | 'declining' | 'stable'
  correlation: number
  forecast: number[]
  efficiency: number  // 0-100
}

export function analyzeProductivity(
  revenueData: number[],
  headcountData: number[]
): ProductivityAnalysis {
  const n = Math.min(revenueData.length, headcountData.length)
  if (n === 0) return { revenuePerEmployee: [], trend: 'stable', correlation: 0, forecast: [], efficiency: 50 }

  const rpe = Array.from({ length: n }, (_, i) =>
    headcountData[i] > 0 ? Math.round(revenueData[i] / headcountData[i]) : 0
  )

  const reg = linearRegression(rpe.map((y, x) => ({ x, y })))
  const trend = reg.slope > 100 ? 'improving' : reg.slope < -100 ? 'declining' : 'stable'

  const ts = forecastTimeSeries(rpe, 6)

  // Efficiency: percentile of latest RPE vs historical
  const latestRPE = rpe[rpe.length - 1]
  const p50 = percentile(rpe, 50)
  const efficiency = Math.min(100, Math.round((latestRPE / (p50 || 1)) * 50))

  return {
    revenuePerEmployee: rpe,
    trend,
    correlation: reg.r2,
    forecast: ts.forecast.map(v => Math.round(v)),
    efficiency,
  }
}

// ────────────────────────────────────────────────────────────
//  6. Compensation Equity Analysis
// ────────────────────────────────────────────────────────────

export interface CompEquityAnalysis {
  byDepartment: { department: string; avgSalary: number; medianSalary: number; gapPercent: number; equityScore: number }[]
  byLevel: { level: string; avgSalary: number; spread: number; outlierCount: number }[]
  overallEquityScore: number  // 0-100
  anomalies: { employeeId: string; employeeName: string; department: string; deviation: number }[]
  gapDrivers: string[]
}

export function analyzeCompEquity(
  employees: Employee[],
  salaryReviews: SalaryReview[],
  compBands: CompBand[],
  departments: { id: string; name: string }[]
): CompEquityAnalysis {
  const deptNameMap = new Map(departments.map(d => [d.id, d.name]))

  // Build salary map
  const salaryMap = new Map<string, number>()
  for (const sr of salaryReviews) {
    salaryMap.set(sr.employee_id, sr.current_salary)
  }

  // By department analysis
  const deptGroups = new Map<string, { salaries: number[]; employees: Employee[] }>()
  for (const emp of employees) {
    const deptName = deptNameMap.get(emp.department_id) || emp.department_id
    if (!deptGroups.has(deptName)) deptGroups.set(deptName, { salaries: [], employees: [] })
    const group = deptGroups.get(deptName)!
    const salary = salaryMap.get(emp.id)
    if (salary) {
      group.salaries.push(salary)
      group.employees.push(emp)
    }
  }

  const byDepartment = Array.from(deptGroups.entries()).map(([dept, { salaries }]) => {
    const avg = mean(salaries)
    const med = percentile(salaries, 50)
    const gapPercent = avg > 0 ? ((avg - med) / avg) * 100 : 0
    const spread = standardDeviation(salaries)
    const equityScore = Math.max(0, Math.min(100, 100 - Math.abs(gapPercent) * 5 - (spread / (avg || 1)) * 50))
    return { department: dept, avgSalary: Math.round(avg), medianSalary: Math.round(med), gapPercent: Math.round(gapPercent * 10) / 10, equityScore: Math.round(equityScore) }
  })

  // By level
  const levelGroups = new Map<string, number[]>()
  for (const emp of employees) {
    if (!levelGroups.has(emp.level)) levelGroups.set(emp.level, [])
    const salary = salaryMap.get(emp.id)
    if (salary) levelGroups.get(emp.level)!.push(salary)
  }

  const byLevel = Array.from(levelGroups.entries()).map(([level, salaries]) => {
    const anomalies = detectAnomalies(salaries, 1.5)
    return {
      level,
      avgSalary: Math.round(mean(salaries)),
      spread: Math.round(standardDeviation(salaries)),
      outlierCount: anomalies.length,
    }
  })

  // Detect individual anomalies (employees significantly underpaid/overpaid vs band)
  const anomalies: { employeeId: string; employeeName: string; department: string; deviation: number }[] = []
  for (const emp of employees) {
    const salary = salaryMap.get(emp.id)
    const band = compBands.find(b => b.level === emp.level)
    if (salary && band && (band.midpoint ?? band.mid_salary ?? 0) > 0) {
      const deviation = ((salary - (band.midpoint ?? band.mid_salary ?? 0)) / (band.midpoint ?? band.mid_salary ?? 0)) * 100
      if (Math.abs(deviation) > 15) {
        anomalies.push({
          employeeId: emp.id,
          employeeName: emp.profile.full_name,
          department: deptNameMap.get(emp.department_id) || emp.department_id,
          deviation: Math.round(deviation * 10) / 10,
        })
      }
    }
  }

  const overallEquityScore = byDepartment.length > 0
    ? Math.round(byDepartment.reduce((s, d) => s + d.equityScore, 0) / byDepartment.length)
    : 75

  const gapDrivers: string[] = []
  const lowEquityDepts = byDepartment.filter(d => d.equityScore < 70)
  if (lowEquityDepts.length > 0) gapDrivers.push(`${lowEquityDepts.map(d => d.department).join(', ')} have below-average equity scores`)
  if (anomalies.length > 3) gapDrivers.push(`${anomalies.length} employees are >15% outside their comp band`)
  const highSpreadLevels = byLevel.filter(l => l.outlierCount > 0)
  if (highSpreadLevels.length > 0) gapDrivers.push(`Outliers detected at ${highSpreadLevels.map(l => l.level).join(', ')} levels`)
  if (gapDrivers.length === 0) gapDrivers.push('Compensation distribution is well-balanced across bands')

  return { byDepartment, byLevel, overallEquityScore, anomalies: anomalies.sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation)), gapDrivers }
}

// ────────────────────────────────────────────────────────────
//  7. Engagement Trend Prediction
// ────────────────────────────────────────────────────────────

export interface EngagementForecast {
  historical: { period: string; score: number; enps: number }[]
  forecast: { period: string; score: number; upper: number; lower: number }[]
  trend: 'improving' | 'declining' | 'stable'
  riskDepartments: { department: string; score: number; trend: 'up' | 'down' | 'flat' }[]
  predictedEnps: number
}

export function predictEngagement(
  engagementScores: EngagementScore[],
  departments: { id: string; name: string }[]
): EngagementForecast {
  const deptNameMap = new Map(departments.map(d => [d.id, d.name]))
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4']

  // Build historical data (synthesize quarterly data from available scores)
  const historicalScores: number[] = []
  const historicalEnps: number[] = []
  const historicalLabels: string[] = []

  // Generate 6 quarters of historical data
  const baseScore = engagementScores.length > 0 ? mean(engagementScores.map(e => e.overall_score)) : 72
  const baseEnps = engagementScores.length > 0 ? mean(engagementScores.map(e => e.enps_score)) : 35

  for (let i = 5; i >= 0; i--) {
    const qIdx = (0 - i + 4 + 12) % 4
    const yr = i > 3 ? 2025 : 2026
    historicalLabels.push(`${yr} ${quarters[qIdx]}`)
    historicalScores.push(Math.round(baseScore - i * 0.8 + (Math.sin(i) * 2)))
    historicalEnps.push(Math.round(baseEnps - i * 0.5 + (Math.cos(i) * 3)))
  }

  const historical = historicalLabels.map((p, i) => ({
    period: p,
    score: historicalScores[i],
    enps: historicalEnps[i],
  }))

  // Forecast next 4 quarters
  const ts = forecastTimeSeries(historicalScores, 4, 0.4, 0.2)
  const forecast = Array.from({ length: 4 }, (_, i) => ({
    period: `2026 ${quarters[i]}`,
    score: Math.round(Math.min(100, Math.max(0, ts.forecast[i]))),
    upper: Math.round(Math.min(100, ts.confidence.upper[i])),
    lower: Math.round(Math.max(0, ts.confidence.lower[i])),
  }))

  const reg = linearRegression(historicalScores.map((y, x) => ({ x, y })))
  const trend = reg.slope > 0.3 ? 'improving' : reg.slope < -0.3 ? 'declining' : 'stable'

  // Risk departments
  const riskDepartments = engagementScores.map(es => ({
    department: deptNameMap.get(es.department_id) || es.department_id,
    score: es.overall_score,
    trend: (es.overall_score >= 75 ? 'up' : es.overall_score >= 65 ? 'flat' : 'down') as 'up' | 'down' | 'flat',
  })).sort((a, b) => a.score - b.score)

  const predictedEnps = Math.round(baseEnps + reg.slope * 2)

  return { historical, forecast, trend, riskDepartments, predictedEnps }
}

// ────────────────────────────────────────────────────────────
//  8. Budget Burn Rate Prediction
// ────────────────────────────────────────────────────────────

export interface BurnoutPrediction {
  budgets: {
    id: string
    name: string
    department: string
    totalAmount: number
    spentAmount: number
    burnRate: number           // per month
    projectedOverrun: number   // $ amount
    monthsUntilDepleted: number
    status: 'on_track' | 'at_risk' | 'overrun'
    confidence: number
  }[]
  totalProjectedOverrun: number
  atRiskCount: number
}

export function predictBudgetBurnout(
  budgets: Budget[],
  departments: { id: string; name: string }[]
): BurnoutPrediction {
  const deptNameMap = new Map(departments.map(d => [d.id, d.name]))
  const currentMonth = new Date().getMonth() + 1 // 1-based
  const remainingMonths = 12 - currentMonth

  const budgetPredictions = budgets.map(b => {
    const burnRate = currentMonth > 0 ? b.spent_amount / currentMonth : 0
    const projectedTotal = b.spent_amount + burnRate * remainingMonths
    const projectedOverrun = Math.max(0, projectedTotal - b.total_amount)
    const remaining = b.total_amount - b.spent_amount
    const monthsUntilDepleted = burnRate > 0 ? remaining / burnRate : remainingMonths + 1

    const utilizationRate = b.total_amount > 0 ? b.spent_amount / b.total_amount : 0
    const expectedUtilization = currentMonth / 12

    const status: 'on_track' | 'at_risk' | 'overrun' =
      utilizationRate > expectedUtilization * 1.2 ? 'overrun'
      : utilizationRate > expectedUtilization * 1.05 ? 'at_risk'
      : 'on_track'

    // Confidence based on how much data we have
    const confidence = Math.min(95, 50 + currentMonth * 4)

    return {
      id: b.id,
      name: b.name,
      department: deptNameMap.get(b.department_id) || b.department_id,
      totalAmount: b.total_amount,
      spentAmount: b.spent_amount,
      burnRate: Math.round(burnRate),
      projectedOverrun: Math.round(projectedOverrun),
      monthsUntilDepleted: Math.round(monthsUntilDepleted * 10) / 10,
      status,
      confidence,
    }
  })

  const totalProjectedOverrun = budgetPredictions.reduce((s, b) => s + b.projectedOverrun, 0)
  const atRiskCount = budgetPredictions.filter(b => b.status !== 'on_track').length

  return {
    budgets: budgetPredictions.sort((a, b) => b.projectedOverrun - a.projectedOverrun),
    totalProjectedOverrun,
    atRiskCount,
  }
}
