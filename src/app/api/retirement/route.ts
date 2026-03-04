import { NextRequest, NextResponse } from 'next/server'
import {
  createRetirementPlan,
  updatePlanConfig,
  enrollEmployee,
  updateContribution,
  changeContributionPercent,
  processContributions,
  calculateVesting,
  getVestingSchedule,
  autoEnrollNewHires,
  processAutoEscalation,
  calculateEmployerMatch,
  getCatchUpEligibility,
  generatePlanReport,
  get5500Data,
  getParticipantStatement,
  updateBeneficiaries,
  updateInvestmentElections,
  terminateParticipation,
  processRollover,
  getComplianceAlerts,
  runNondiscriminationTest,
  calculateRMD,
  IRS_LIMITS_2026,
} from '@/lib/services/retirement-admin'

// GET /api/retirement - Query plans, vesting, reports, compliance
export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'limits'

    switch (action) {
      case 'limits': {
        // Return current IRS limits for reference
        return NextResponse.json({
          year: 2026,
          limits: {
            employeeDeferralLimit: IRS_LIMITS_2026.EMPLOYEE_DEFERRAL_LIMIT,
            catchUpLimit: IRS_LIMITS_2026.CATCH_UP_LIMIT,
            totalAnnualAddition: IRS_LIMITS_2026.TOTAL_ANNUAL_ADDITION,
            totalWithCatchUp: IRS_LIMITS_2026.TOTAL_WITH_CATCH_UP,
            compensationLimit: IRS_LIMITS_2026.COMPENSATION_LIMIT,
            hceThreshold: IRS_LIMITS_2026.HCE_COMPENSATION_THRESHOLD,
            simpleIRADeferral: IRS_LIMITS_2026.SIMPLE_IRA_DEFERRAL,
            simpleIRACatchUp: IRS_LIMITS_2026.SIMPLE_IRA_CATCH_UP,
            sepIRALimit: IRS_LIMITS_2026.SEP_IRA_LIMIT,
            rmdAge: IRS_LIMITS_2026.RMD_AGE,
          },
        })
      }

      case 'vesting': {
        const planId = url.searchParams.get('planId')
        const employeeId = url.searchParams.get('employeeId')
        if (!planId || !employeeId) {
          return NextResponse.json({ error: 'planId and employeeId are required' }, { status: 400 })
        }
        const result = await calculateVesting(orgId, planId, employeeId)
        return NextResponse.json(result)
      }

      case 'vesting-schedule': {
        const planId = url.searchParams.get('planId')
        if (!planId) {
          return NextResponse.json({ error: 'planId is required' }, { status: 400 })
        }
        const result = await getVestingSchedule(orgId, planId)
        return NextResponse.json(result)
      }

      case 'catch-up': {
        const planId = url.searchParams.get('planId')
        const employeeId = url.searchParams.get('employeeId')
        if (!planId || !employeeId) {
          return NextResponse.json({ error: 'planId and employeeId are required' }, { status: 400 })
        }
        const result = await getCatchUpEligibility(orgId, planId, employeeId)
        return NextResponse.json(result)
      }

      case 'report': {
        const planId = url.searchParams.get('planId')
        if (!planId) {
          return NextResponse.json({ error: 'planId is required' }, { status: 400 })
        }
        const result = await generatePlanReport(orgId, planId)
        return NextResponse.json(result)
      }

      case '5500': {
        const planId = url.searchParams.get('planId')
        const planYear = url.searchParams.get('planYear')
        if (!planId) {
          return NextResponse.json({ error: 'planId is required' }, { status: 400 })
        }
        const result = await get5500Data(orgId, planId, planYear ? parseInt(planYear) : undefined)
        return NextResponse.json(result)
      }

      case 'statement': {
        const planId = url.searchParams.get('planId')
        const employeeId = url.searchParams.get('employeeId')
        const periodStart = url.searchParams.get('periodStart') || undefined
        const periodEnd = url.searchParams.get('periodEnd') || undefined
        if (!planId || !employeeId) {
          return NextResponse.json({ error: 'planId and employeeId are required' }, { status: 400 })
        }
        const result = await getParticipantStatement(orgId, planId, employeeId, periodStart, periodEnd)
        return NextResponse.json(result)
      }

      case 'compliance': {
        const planId = url.searchParams.get('planId')
        if (!planId) {
          return NextResponse.json({ error: 'planId is required' }, { status: 400 })
        }
        const result = await getComplianceAlerts(orgId, planId)
        return NextResponse.json({ alerts: result, total: result.length })
      }

      case 'rmd': {
        const planId = url.searchParams.get('planId')
        const employeeId = url.searchParams.get('employeeId')
        const balance = url.searchParams.get('priorYearBalance')
        const ageParam = url.searchParams.get('employeeAge')
        if (!planId || !employeeId) {
          return NextResponse.json({ error: 'planId and employeeId are required' }, { status: 400 })
        }
        const result = await calculateRMD(
          orgId,
          planId,
          employeeId,
          balance ? parseInt(balance) : undefined,
          ageParam ? parseInt(ageParam) : undefined,
        )
        return NextResponse.json(result)
      }

      case 'match-preview': {
        const employeeContribution = parseInt(url.searchParams.get('employeeContribution') || '0')
        const salary = parseInt(url.searchParams.get('salary') || '0')
        const employeePercent = parseFloat(url.searchParams.get('employeePercent') || '0')
        const matchPercent = parseFloat(url.searchParams.get('matchPercent') || '100')
        const matchCap = parseFloat(url.searchParams.get('matchCap') || '6')
        if (!salary || !employeeContribution) {
          return NextResponse.json({ error: 'salary and employeeContribution are required' }, { status: 400 })
        }
        const matchAmount = calculateEmployerMatch(
          employeeContribution,
          salary,
          employeePercent,
          matchPercent,
          matchCap,
        )
        return NextResponse.json({
          employeeContribution,
          salary,
          employeePercent,
          matchPercent,
          matchCap,
          employerMatchAmount: matchAmount,
        })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: unknown) {
    console.error('[GET /api/retirement] Error:', error)
    const message = error instanceof Error ? error.message : 'Retirement query failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST /api/retirement - Plan management, enrollment, contributions, testing
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'create-plan': {
        const {
          name, type, provider, planNumber,
          employeeContributionLimit, catchUpContributionLimit,
          employerMatchPercent, employerMatchCap,
          vestingType, vestingSchedule,
          autoEnroll, autoEnrollPercent,
          autoEscalate, escalationPercent, escalationCap,
          effectiveDate,
        } = body
        if (!name || !type || !provider) {
          return NextResponse.json(
            { error: 'name, type, and provider are required' },
            { status: 400 }
          )
        }
        const result = await createRetirementPlan({
          orgId, name, type, provider, planNumber,
          employeeContributionLimit, catchUpContributionLimit,
          employerMatchPercent, employerMatchCap,
          vestingType, vestingSchedule,
          autoEnroll, autoEnrollPercent,
          autoEscalate, escalationPercent, escalationCap,
          effectiveDate,
        })
        return NextResponse.json(result, { status: 201 })
      }

      case 'update-plan': {
        const { planId, ...updates } = body
        if (!planId) {
          return NextResponse.json({ error: 'planId is required' }, { status: 400 })
        }
        const { action: _action, ...cleanUpdates } = updates
        const result = await updatePlanConfig(orgId, planId, cleanUpdates)
        return NextResponse.json(result)
      }

      case 'enroll': {
        const {
          planId, employeeId, contributionPercent,
          isRoth, beneficiaries, investmentElections,
        } = body
        if (!planId || !employeeId || contributionPercent === undefined) {
          return NextResponse.json(
            { error: 'planId, employeeId, and contributionPercent are required' },
            { status: 400 }
          )
        }
        const result = await enrollEmployee({
          orgId, planId, employeeId, contributionPercent,
          isRoth, beneficiaries, investmentElections,
        })
        return NextResponse.json(result, { status: 201 })
      }

      case 'update-contribution': {
        const { planId, employeeId, contributionPercent, isRoth } = body
        if (!planId || !employeeId) {
          return NextResponse.json(
            { error: 'planId and employeeId are required' },
            { status: 400 }
          )
        }
        const result = await updateContribution(orgId, planId, employeeId, {
          contributionPercent,
          isRoth,
        })
        return NextResponse.json(result)
      }

      case 'change-percent': {
        const { planId, employeeId, newPercent } = body
        if (!planId || !employeeId || newPercent === undefined) {
          return NextResponse.json(
            { error: 'planId, employeeId, and newPercent are required' },
            { status: 400 }
          )
        }
        const result = await changeContributionPercent(orgId, planId, employeeId, newPercent)
        return NextResponse.json(result)
      }

      case 'process-contribution': {
        const {
          planId, employeeId, payrollRunId,
          employeeAmount, employeePercent, period,
          isPreTax, salary,
        } = body
        if (!planId || !employeeId || !employeeAmount || !period || !salary) {
          return NextResponse.json(
            { error: 'planId, employeeId, employeeAmount, period, and salary are required' },
            { status: 400 }
          )
        }
        const result = await processContributions({
          orgId, planId, employeeId, payrollRunId,
          employeeAmount, employeePercent: employeePercent || 0,
          period, isPreTax, salary,
        })
        return NextResponse.json(result)
      }

      case 'auto-enroll': {
        const { planId, employeeIds } = body
        if (!planId || !employeeIds?.length) {
          return NextResponse.json(
            { error: 'planId and employeeIds are required' },
            { status: 400 }
          )
        }
        const result = await autoEnrollNewHires(orgId, planId, employeeIds)
        return NextResponse.json(result)
      }

      case 'auto-escalate': {
        const { planId } = body
        if (!planId) {
          return NextResponse.json({ error: 'planId is required' }, { status: 400 })
        }
        const result = await processAutoEscalation(orgId, planId)
        return NextResponse.json(result)
      }

      case 'update-beneficiaries': {
        const { planId, employeeId, beneficiaries } = body
        if (!planId || !employeeId || !beneficiaries) {
          return NextResponse.json(
            { error: 'planId, employeeId, and beneficiaries are required' },
            { status: 400 }
          )
        }
        const result = await updateBeneficiaries(orgId, planId, employeeId, beneficiaries)
        return NextResponse.json(result)
      }

      case 'update-investments': {
        const { planId, employeeId, elections } = body
        if (!planId || !employeeId || !elections) {
          return NextResponse.json(
            { error: 'planId, employeeId, and elections are required' },
            { status: 400 }
          )
        }
        const result = await updateInvestmentElections(orgId, planId, employeeId, elections)
        return NextResponse.json(result)
      }

      case 'terminate': {
        const { planId, employeeId, terminationDate } = body
        if (!planId || !employeeId) {
          return NextResponse.json(
            { error: 'planId and employeeId are required' },
            { status: 400 }
          )
        }
        const result = await terminateParticipation(orgId, planId, employeeId, terminationDate)
        return NextResponse.json(result)
      }

      case 'rollover': {
        const { planId, employeeId, rolloverDetails } = body
        if (!planId || !employeeId || !rolloverDetails) {
          return NextResponse.json(
            { error: 'planId, employeeId, and rolloverDetails are required' },
            { status: 400 }
          )
        }
        const result = await processRollover(orgId, planId, employeeId, rolloverDetails)
        return NextResponse.json(result)
      }

      case 'nondiscrimination-test': {
        const { planId, testType, hceThreshold } = body
        if (!planId || !testType) {
          return NextResponse.json(
            { error: 'planId and testType (ADP or ACP) are required' },
            { status: 400 }
          )
        }
        if (testType !== 'ADP' && testType !== 'ACP') {
          return NextResponse.json(
            { error: 'testType must be ADP or ACP' },
            { status: 400 }
          )
        }
        const result = await runNondiscriminationTest(orgId, planId, testType, hceThreshold)
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: unknown) {
    console.error('[POST /api/retirement] Error:', error)
    const message = error instanceof Error ? error.message : 'Retirement operation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
