import { NextRequest, NextResponse } from 'next/server'
import {
  getCountryBenefitRequirements,
  createGlobalPlan,
  updateGlobalPlan,
  enrollEmployee,
  getCountryConfig,
  updateCountryConfig,
  getMandatoryBenefits,
  getSupplementaryOptions,
  calculateBenefitCost,
  getBenefitComparison,
  generateComplianceReport,
  benchmarkAgainstMarket,
  getGlobalBenefitsDashboard,
  syncWithLocalCarrier,
  getStatutoryRequirements,
  estimateTotalCompensation,
} from '@/lib/services/global-benefits'

// GET /api/global-benefits - Country info, dashboard, compliance, benchmarks
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'dashboard'

    // Public country info endpoints
    if (action === 'country-requirements' || action === 'mandatory' || action === 'supplementary' || action === 'statutory') {
      const countryCode = url.searchParams.get('countryCode')
      if (!countryCode) return NextResponse.json({ error: 'countryCode is required' }, { status: 400 })

      switch (action) {
        case 'country-requirements':
          return NextResponse.json(getCountryBenefitRequirements(countryCode))
        case 'mandatory':
          return NextResponse.json({ benefits: getMandatoryBenefits(countryCode) })
        case 'supplementary':
          return NextResponse.json({ benefits: getSupplementaryOptions(countryCode) })
        case 'statutory':
          return NextResponse.json(getStatutoryRequirements(countryCode))
      }
    }

    // Cost calculation
    if (action === 'calculate-cost') {
      const countryCode = url.searchParams.get('countryCode')
      const salary = url.searchParams.get('salary')
      const currency = url.searchParams.get('currency') || 'USD'
      const includeSupplementary = url.searchParams.get('includeSupplementary') === 'true'
      if (!countryCode || !salary) return NextResponse.json({ error: 'countryCode and salary are required' }, { status: 400 })
      const result = calculateBenefitCost(countryCode, parseInt(salary), currency, { includeSupplementary })
      return NextResponse.json(result)
    }

    // Country comparison
    if (action === 'compare') {
      const countries = url.searchParams.get('countries')
      if (!countries) return NextResponse.json({ error: 'countries (comma-separated) is required' }, { status: 400 })
      const categories = url.searchParams.get('categories')?.split(',') as any || undefined
      const result = getBenefitComparison(countries.split(','), categories)
      return NextResponse.json(result)
    }

    // Total compensation estimation
    if (action === 'total-compensation') {
      const countryCode = url.searchParams.get('countryCode')
      const salary = url.searchParams.get('salary')
      const currency = url.searchParams.get('currency') || 'USD'
      if (!countryCode || !salary) return NextResponse.json({ error: 'countryCode and salary are required' }, { status: 400 })
      const supplementary = url.searchParams.get('supplementary')?.split(',') || undefined
      const result = estimateTotalCompensation(countryCode, parseInt(salary), currency, supplementary)
      return NextResponse.json(result)
    }

    // Benchmark
    if (action === 'benchmark') {
      const countryCode = url.searchParams.get('countryCode')
      const category = url.searchParams.get('category') as any
      const cost = url.searchParams.get('cost')
      if (!countryCode || !category || !cost) {
        return NextResponse.json({ error: 'countryCode, category, and cost are required' }, { status: 400 })
      }
      const result = benchmarkAgainstMarket(countryCode, category, parseInt(cost))
      return NextResponse.json(result)
    }

    // Authenticated endpoints
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    switch (action) {
      case 'dashboard':
        return NextResponse.json(await getGlobalBenefitsDashboard(orgId))

      case 'compliance-report':
        return NextResponse.json(await generateComplianceReport(orgId))

      case 'country-config': {
        const countryCode = url.searchParams.get('countryCode')
        if (!countryCode) return NextResponse.json({ error: 'countryCode is required' }, { status: 400 })
        const result = await getCountryConfig(orgId, countryCode)
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[GET /api/global-benefits] Error:', error)
    return NextResponse.json({ error: error?.message || 'Global benefits query failed' }, { status: 500 })
  }
}

// POST /api/global-benefits - Plans, enrollment, config, carrier sync
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'create-plan': {
        const { name, category, country, countryCode, provider, description, isStatutory, statutoryReference, costEmployee, costEmployer, currency, coverageDetails, eligibilityCriteria, effectiveDate } = body
        if (!name || !category || !country || !countryCode || !currency) {
          return NextResponse.json({ error: 'name, category, country, countryCode, and currency are required' }, { status: 400 })
        }
        const result = await createGlobalPlan(orgId, { name, category, country, countryCode, provider, description, isStatutory, statutoryReference, costEmployee, costEmployer, currency, coverageDetails, eligibilityCriteria, effectiveDate })
        return NextResponse.json(result)
      }

      case 'update-plan': {
        const { planId, ...updates } = body
        if (!planId) return NextResponse.json({ error: 'planId is required' }, { status: 400 })
        const result = await updateGlobalPlan(orgId, planId, updates)
        return NextResponse.json(result)
      }

      case 'enroll': {
        const { planId, employeeId, country, coverageLevel, dependentCount, employeeContribution, employerContribution, currency, enrolledAt } = body
        if (!planId || !employeeId || !country || !currency || !enrolledAt) {
          return NextResponse.json({ error: 'planId, employeeId, country, currency, and enrolledAt are required' }, { status: 400 })
        }
        const result = await enrollEmployee(orgId, { planId, employeeId, country, coverageLevel, dependentCount, employeeContribution, employerContribution, currency, enrolledAt })
        return NextResponse.json(result)
      }

      case 'update-country-config': {
        const { countryCode, mandatoryBenefits, supplementaryBenefits, taxImplications, complianceNotes } = body
        if (!countryCode) return NextResponse.json({ error: 'countryCode is required' }, { status: 400 })
        const result = await updateCountryConfig(orgId, countryCode, { mandatoryBenefits, supplementaryBenefits, taxImplications, complianceNotes })
        return NextResponse.json(result)
      }

      case 'sync-carrier': {
        const { planId } = body
        if (!planId) return NextResponse.json({ error: 'planId is required' }, { status: 400 })
        const result = await syncWithLocalCarrier(orgId, planId)
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[POST /api/global-benefits] Error:', error)
    return NextResponse.json({ error: error?.message || 'Global benefits operation failed' }, { status: 500 })
  }
}
