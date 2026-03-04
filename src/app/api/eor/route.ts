import { NextRequest, NextResponse } from 'next/server'
import {
  createEntity,
  updateEntity,
  onboardEmployee,
  offboardEmployee,
  getCountryCompliance,
  calculateTotalCost,
  generateContract,
  getEntityDashboard,
  syncWithLocalPayroll,
  getEORAnalytics,
  estimateCountryCost,
  checkVisaRequirements,
  manageLocalBenefits,
  getComplianceCalendar,
  generateInvoice,
  getCountryGuide,
  compareCountryCosts,
} from '@/lib/services/eor-service'

// GET /api/eor - Country compliance, guides, visa, dashboard, analytics
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'dashboard'

    // Country info endpoints are public
    if (action === 'country-compliance' || action === 'country-guide' || action === 'visa-requirements' || action === 'local-benefits') {
      const countryCode = url.searchParams.get('countryCode')
      if (!countryCode) return NextResponse.json({ error: 'countryCode is required' }, { status: 400 })

      switch (action) {
        case 'country-compliance':
          return NextResponse.json(getCountryCompliance(countryCode))
        case 'country-guide':
          return NextResponse.json(getCountryGuide(countryCode))
        case 'visa-requirements':
          return NextResponse.json(checkVisaRequirements(countryCode))
        case 'local-benefits':
          return NextResponse.json(manageLocalBenefits(countryCode))
      }
    }

    // Cost estimation
    if (action === 'estimate-cost') {
      const countryCode = url.searchParams.get('countryCode')
      const salary = url.searchParams.get('salary')
      if (!countryCode || !salary) return NextResponse.json({ error: 'countryCode and salary are required' }, { status: 400 })
      return NextResponse.json(estimateCountryCost(countryCode, parseInt(salary)))
    }

    if (action === 'compare-costs') {
      const countries = url.searchParams.get('countries')
      const salary = url.searchParams.get('salary')
      if (!countries || !salary) return NextResponse.json({ error: 'countries (comma-separated) and salary are required' }, { status: 400 })
      const result = compareCountryCosts(countries.split(','), parseInt(salary))
      return NextResponse.json({ comparisons: result })
    }

    if (action === 'total-cost') {
      const countryCode = url.searchParams.get('countryCode')
      const salary = url.searchParams.get('salary')
      const currency = url.searchParams.get('currency') || 'USD'
      if (!countryCode || !salary) return NextResponse.json({ error: 'countryCode and salary are required' }, { status: 400 })
      return NextResponse.json(calculateTotalCost(countryCode, parseInt(salary), currency))
    }

    if (action === 'compliance-calendar') {
      const countryCode = url.searchParams.get('countryCode')
      if (!countryCode) return NextResponse.json({ error: 'countryCode is required' }, { status: 400 })
      return NextResponse.json({ events: getComplianceCalendar(countryCode) })
    }

    // Authenticated endpoints
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    switch (action) {
      case 'dashboard':
        return NextResponse.json(await getEntityDashboard(orgId))

      case 'analytics':
        return NextResponse.json(await getEORAnalytics(orgId))

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[GET /api/eor] Error:', error)
    return NextResponse.json({ error: error?.message || 'EOR query failed' }, { status: 500 })
  }
}

// POST /api/eor - Create entities, onboard/offboard employees, contracts, invoices
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'create-entity': {
        const { country, countryCode, legalEntityName, partnerName, currency, taxId, registrationNumber, address, monthlyFee, setupFee, contractStartDate, contractEndDate, benefits, complianceNotes } = body
        if (!countryCode || !legalEntityName || !partnerName) {
          return NextResponse.json({ error: 'countryCode, legalEntityName, and partnerName are required' }, { status: 400 })
        }
        const result = await createEntity(orgId, { country, countryCode, legalEntityName, partnerName, currency: currency || 'USD', taxId, registrationNumber, address, monthlyFee, setupFee, contractStartDate, contractEndDate, benefits, complianceNotes })
        return NextResponse.json(result)
      }

      case 'update-entity': {
        const { entityId, ...updates } = body
        if (!entityId) return NextResponse.json({ error: 'entityId is required' }, { status: 400 })
        const result = await updateEntity(orgId, entityId, updates)
        return NextResponse.json(result)
      }

      case 'onboard-employee': {
        const { eorEntityId, fullName, email, jobTitle, department, salary, currency, startDate, endDate, contractType, localBenefits, taxSetup, visaRequired, notes } = body
        if (!eorEntityId || !fullName || !email || !salary || !currency || !startDate) {
          return NextResponse.json({ error: 'eorEntityId, fullName, email, salary, currency, and startDate are required' }, { status: 400 })
        }
        const result = await onboardEmployee(orgId, { eorEntityId, fullName, email, jobTitle, department, salary, currency, startDate, endDate, contractType, localBenefits, taxSetup, visaRequired, notes })
        return NextResponse.json(result)
      }

      case 'offboard-employee': {
        const { employeeId, endDate } = body
        if (!employeeId) return NextResponse.json({ error: 'employeeId is required' }, { status: 400 })
        const result = await offboardEmployee(orgId, employeeId, endDate)
        return NextResponse.json(result)
      }

      case 'generate-contract': {
        const { countryCode, fullName, jobTitle, salary, currency, startDate, contractType } = body
        if (!countryCode || !fullName || !jobTitle || !salary || !currency || !startDate) {
          return NextResponse.json({ error: 'countryCode, fullName, jobTitle, salary, currency, and startDate are required' }, { status: 400 })
        }
        const result = generateContract(countryCode, { fullName, jobTitle, salary, currency, startDate, contractType })
        return NextResponse.json(result)
      }

      case 'sync-payroll': {
        const { entityId } = body
        if (!entityId) return NextResponse.json({ error: 'entityId is required' }, { status: 400 })
        const result = await syncWithLocalPayroll(orgId, entityId)
        return NextResponse.json(result)
      }

      case 'generate-invoice': {
        const { entityId, period, employees, feePerEmployee } = body
        if (!entityId || !period || !employees || !feePerEmployee) {
          return NextResponse.json({ error: 'entityId, period, employees, and feePerEmployee are required' }, { status: 400 })
        }
        const result = generateInvoice(entityId, period, employees, feePerEmployee)
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[POST /api/eor] Error:', error)
    return NextResponse.json({ error: error?.message || 'EOR operation failed' }, { status: 500 })
  }
}
