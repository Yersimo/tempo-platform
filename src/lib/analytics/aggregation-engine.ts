// ---------------------------------------------------------------------------
// Analytics Aggregation Engine
// ---------------------------------------------------------------------------
// Computes daily snapshots from store data and generates rolling forecasts
// with configurable assumptions for workforce planning scenarios.
// ---------------------------------------------------------------------------

export interface DailySnapshot {
  date: string
  headcount: {
    total: number
    byDepartment: Record<string, number>
    byCountry: Record<string, number>
    byLevel: Record<string, number>
  }
  payroll: {
    totalGross: number
    totalNet: number
    totalDeductions: number
    avgSalary: number
  }
  recruiting: {
    openPositions: number
    applicationsReceived: number
    hired: number
    timeToFill: number
  }
  attrition: {
    terminated: number
    turnoverRate: number
    voluntaryRate: number
  }
  learning: {
    coursesCompleted: number
    complianceRate: number
    avgCompletionRate: number
  }
  engagement: {
    avgScore: number
    responseRate: number
    eNPS: number
  }
  finance: {
    arBalance: number
    apBalance: number
    cashBalance: number
    burnRate: number
  }
  compliance: {
    score: number
    openItems: number
    overdueItems: number
  }
}

export interface ForecastAssumptions {
  monthlyHiringRate: number    // e.g., 0.05 = 5% growth per month
  annualAttritionRate: number  // e.g., 0.12 = 12% annual
  annualSalaryIncrease: number // e.g., 5 = 5% annual
  benefitsAsPercentOfSalary: number // e.g., 25 = 25%
  equipmentCostPerHire: number // in cents
  recruitingCostPerHire: number // in cents
  trainingCostPerHire: number  // in cents
}

export interface MonthlyForecast {
  period: string
  headcount: number
  hires: number
  attrition: number
  salaryCost: number
  benefitsCost: number
  equipmentCost: number
  recruitingCost: number
  trainingCost: number
  totalCost: number
}

// ─── Preset assumption sets ────────────────────────────────────────────────

export const ASSUMPTION_PRESETS: Record<string, { label: string; description: string; assumptions: ForecastAssumptions }> = {
  aggressive: {
    label: 'Aggressive Growth',
    description: 'High hiring, competitive salaries, rapid expansion',
    assumptions: {
      monthlyHiringRate: 0.08,
      annualAttritionRate: 0.15,
      annualSalaryIncrease: 8,
      benefitsAsPercentOfSalary: 30,
      equipmentCostPerHire: 350000, // $3,500
      recruitingCostPerHire: 500000, // $5,000
      trainingCostPerHire: 200000,  // $2,000
    },
  },
  base: {
    label: 'Steady State',
    description: 'Moderate hiring to backfill attrition with standard raises',
    assumptions: {
      monthlyHiringRate: 0.03,
      annualAttritionRate: 0.12,
      annualSalaryIncrease: 5,
      benefitsAsPercentOfSalary: 25,
      equipmentCostPerHire: 250000, // $2,500
      recruitingCostPerHire: 300000, // $3,000
      trainingCostPerHire: 150000,  // $1,500
    },
  },
  conservative: {
    label: 'Cost Reduction',
    description: 'Minimal hiring, freeze on raises, lean operations',
    assumptions: {
      monthlyHiringRate: 0.01,
      annualAttritionRate: 0.10,
      annualSalaryIncrease: 2,
      benefitsAsPercentOfSalary: 20,
      equipmentCostPerHire: 150000, // $1,500
      recruitingCostPerHire: 200000, // $2,000
      trainingCostPerHire: 50000,   // $500
    },
  },
  downturn: {
    label: 'Market Downturn',
    description: 'Hiring freeze, potential layoffs, minimal spending',
    assumptions: {
      monthlyHiringRate: 0.005,
      annualAttritionRate: 0.20,
      annualSalaryIncrease: 0,
      benefitsAsPercentOfSalary: 20,
      equipmentCostPerHire: 100000, // $1,000
      recruitingCostPerHire: 100000, // $1,000
      trainingCostPerHire: 25000,   // $250
    },
  },
}

// ─── Compute daily snapshot from current store data ────────────────────────

export function computeDailySnapshot(store: Record<string, any>): DailySnapshot {
  const today = new Date().toISOString().split('T')[0]
  const allEmployees = store.employees || []
  const activeEmployees = allEmployees.filter((e: any) => !e.termination_date)

  // Headcount breakdowns
  const byDepartment: Record<string, number> = {}
  const byCountry: Record<string, number> = {}
  const byLevel: Record<string, number> = {}
  const departments = store.departments || []

  activeEmployees.forEach((e: any) => {
    const dept = departments.find((d: any) => d.id === e.department_id)?.name || 'Unassigned'
    byDepartment[dept] = (byDepartment[dept] || 0) + 1
    const country = e.country || 'Unknown'
    byCountry[country] = (byCountry[country] || 0) + 1
    const level = e.level || 'Unknown'
    byLevel[level] = (byLevel[level] || 0) + 1
  })

  // Payroll — latest run
  const payrollRuns = store.payrollRuns || []
  const latestPayroll = payrollRuns.sort(
    (a: any, b: any) => (b.created_at || '').localeCompare(a.created_at || ''),
  )?.[0]

  // Recruiting
  const openPositions =
    (store.jobPostings || []).filter(
      (j: any) => j.status === 'published' || j.status === 'open',
    ).length || 0
  const applications = store.applications || []

  // Attrition
  const terminated = allEmployees.filter((e: any) => e.termination_date).length
  const total = allEmployees.length || 1

  // Learning
  const enrollments = store.enrollments || []
  const completedEnrollments = enrollments.filter(
    (e: any) => e.status === 'completed',
  ).length
  const totalEnrollments = enrollments.length || 1

  // Compliance
  const complianceReqs = store.complianceRequirements || []
  const compliant = complianceReqs.filter(
    (r: any) => r.status === 'compliant',
  ).length
  const totalReqs = complianceReqs.length || 1

  return {
    date: today,
    headcount: {
      total: activeEmployees.length,
      byDepartment,
      byCountry,
      byLevel,
    },
    payroll: {
      totalGross: latestPayroll?.total_gross || latestPayroll?.totalGross || 0,
      totalNet: latestPayroll?.total_net || latestPayroll?.totalNet || 0,
      totalDeductions:
        (latestPayroll?.total_gross || 0) - (latestPayroll?.total_net || 0),
      avgSalary:
        activeEmployees.length > 0
          ? Math.round(
              activeEmployees.reduce(
                (s: number, e: any) => s + (e.salary || 0),
                0,
              ) / activeEmployees.length,
            )
          : 0,
    },
    recruiting: {
      openPositions,
      applicationsReceived: applications.length,
      hired: applications.filter((a: any) => a.stage === 'hired').length,
      timeToFill: 30,
    },
    attrition: {
      terminated,
      turnoverRate: Math.round((terminated / total) * 100),
      voluntaryRate: Math.round(((terminated * 0.7) / total) * 100),
    },
    learning: {
      coursesCompleted: completedEnrollments,
      complianceRate: Math.round(
        (completedEnrollments / totalEnrollments) * 100,
      ),
      avgCompletionRate: Math.round(
        (completedEnrollments / totalEnrollments) * 100,
      ),
    },
    engagement: { avgScore: 72, responseRate: 85, eNPS: 35 },
    finance: { arBalance: 0, apBalance: 0, cashBalance: 0, burnRate: 0 },
    compliance: {
      score: Math.round((compliant / totalReqs) * 100),
      openItems: totalReqs - compliant,
      overdueItems: 0,
    },
  }
}

// ─── Generate 12-month rolling forecast ────────────────────────────────────

export function generateRollingForecast(
  snapshot: DailySnapshot,
  assumptions: ForecastAssumptions,
): MonthlyForecast[] {
  const months: MonthlyForecast[] = []
  const now = new Date()

  let headcount = snapshot.headcount.total || 50 // fallback for demo
  let monthlySalary = snapshot.payroll.totalGross || headcount * 800000 // fallback: $8k/mo avg

  for (let i = 0; i < 12; i++) {
    const month = new Date(now.getFullYear(), now.getMonth() + i + 1, 1)
    const period = month.toISOString().substring(0, 7)

    // Apply assumptions
    const monthlyHires = Math.max(
      1,
      Math.round(assumptions.monthlyHiringRate * headcount),
    )
    const monthlyAttrition = Math.round(
      (assumptions.annualAttritionRate / 12) * headcount,
    )
    const prevHeadcount = headcount
    headcount = headcount + monthlyHires - monthlyAttrition

    // Salary grows with headcount + annual increases
    const salaryGrowthFactor =
      1 + assumptions.annualSalaryIncrease / 12 / 100
    const headcountRatio =
      prevHeadcount > 0 ? headcount / prevHeadcount : 1
    monthlySalary = Math.round(
      monthlySalary * salaryGrowthFactor * headcountRatio,
    )

    const benefitsCost = Math.round(
      monthlySalary * (assumptions.benefitsAsPercentOfSalary / 100),
    )
    const equipmentCost = monthlyHires * assumptions.equipmentCostPerHire
    const recruitingCost = monthlyHires * assumptions.recruitingCostPerHire
    const trainingCost = monthlyHires * assumptions.trainingCostPerHire

    months.push({
      period,
      headcount,
      hires: monthlyHires,
      attrition: monthlyAttrition,
      salaryCost: monthlySalary,
      benefitsCost,
      equipmentCost,
      recruitingCost,
      trainingCost,
      totalCost:
        monthlySalary +
        benefitsCost +
        equipmentCost +
        recruitingCost +
        trainingCost,
    })
  }

  return months
}

// ─── Compare two scenarios ─────────────────────────────────────────────────

export function compareScenarios(
  scenarioA: MonthlyForecast[],
  scenarioB: MonthlyForecast[],
): {
  periods: string[]
  headcountDiff: number[]
  costDiff: number[]
  totalDifference: number
} {
  const periods = scenarioA.map((m) => m.period)
  const headcountDiff = scenarioA.map(
    (a, i) => a.headcount - (scenarioB[i]?.headcount || 0),
  )
  const costDiff = scenarioA.map(
    (a, i) => a.totalCost - (scenarioB[i]?.totalCost || 0),
  )
  const totalDifference = costDiff.reduce((sum, d) => sum + d, 0)

  return { periods, headcountDiff, costDiff, totalDifference }
}

// ─── Format helpers ────────────────────────────────────────────────────────

export function formatCents(cents: number): string {
  const abs = Math.abs(cents)
  if (abs >= 100000000) return `${(cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0, notation: 'compact' } as any)}`
  return (cents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })
}
