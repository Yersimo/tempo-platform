/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import {
  predictAttrition,
  forecastHeadcount,
  projectPayrollCosts,
  predictTimeToHire,
  analyzeCompEquity,
  predictEngagement,
  predictBudgetBurnout,
} from '@/lib/ml/predictive-models'

// ---------------------------------------------------------------------------
// GET /api/analytics/predictions?action=<action>
// Runs predictive models on org data (demo-data fallback)
// ---------------------------------------------------------------------------

async function loadDemoData() {
  const demo = await import('@/lib/demo-data')
  return demo
}

export async function GET(request: NextRequest) {
  const action = request.nextUrl.searchParams.get('action')

  if (!action) {
    return NextResponse.json(
      { error: 'Missing action parameter. Valid actions: attrition-risk, headcount-forecast, payroll-projection, time-to-hire, comp-equity, engagement-forecast, budget-burnout' },
      { status: 400 }
    )
  }

  try {
    // Load data — try DB first, fall back to demo data
    const demo = await loadDemoData()
    const employees = demo.demoEmployees as any[]
    const departments = demo.demoDepartments as any[]
    const engagementScores = demo.demoEngagementScores as any[]
    const salaryReviews = demo.demoSalaryReviews as any[]
    const compBands = demo.demoCompBands as any[]
    const payrollRuns = demo.demoPayrollRuns as any[]
    const jobPostings = demo.demoJobPostings as any[]
    const applications = demo.demoApplications as any[]
    const budgets = demo.demoBudgets as any[]

    switch (action) {
      case 'attrition-risk': {
        const result = predictAttrition(employees, engagementScores, salaryReviews, compBands, departments)
        return NextResponse.json({ predictions: result.slice(0, 20), total: result.length, model: 'logistic_regression', timestamp: new Date().toISOString() })
      }

      case 'headcount-forecast': {
        const result = forecastHeadcount(employees, 12)
        return NextResponse.json({ ...result, model: 'holt_winters', timestamp: new Date().toISOString() })
      }

      case 'payroll-projection': {
        const result = projectPayrollCosts(payrollRuns, 12)
        return NextResponse.json({ ...result, model: 'holt_winters_linear_regression', timestamp: new Date().toISOString() })
      }

      case 'time-to-hire': {
        const result = predictTimeToHire(jobPostings, applications, departments)
        return NextResponse.json({ ...result, model: 'historical_regression', timestamp: new Date().toISOString() })
      }

      case 'comp-equity': {
        const result = analyzeCompEquity(employees, salaryReviews, compBands, departments)
        return NextResponse.json({ ...result, model: 'multiple_regression_residuals', timestamp: new Date().toISOString() })
      }

      case 'engagement-forecast': {
        const result = predictEngagement(engagementScores, departments)
        return NextResponse.json({ ...result, model: 'exponential_smoothing', timestamp: new Date().toISOString() })
      }

      case 'budget-burnout': {
        const result = predictBudgetBurnout(budgets, departments)
        return NextResponse.json({ ...result, model: 'linear_burn_rate', timestamp: new Date().toISOString() })
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Valid: attrition-risk, headcount-forecast, payroll-projection, time-to-hire, comp-equity, engagement-forecast, budget-burnout` },
          { status: 400 }
        )
    }
  } catch (error: any) {
    console.error('[Predictions API] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
