import { NextRequest, NextResponse } from 'next/server'
import {
  onboardContractor,
  offboardContractor,
  createContract,
  amendContract,
  terminateContract,
  processPayment,
  approvePayment,
  getPaymentHistory,
  assessMisclassificationRisk,
  getComplianceStatus,
  collectTaxDocuments,
  validateTaxDocuments,
  generatePaymentReport,
  getContractorDashboard,
  convertToEmployee,
  bulkOnboard,
  getContractExpiring,
  calculateTotalSpend,
} from '@/lib/services/cor-service'

// GET /api/cor - Dashboard, compliance, payments, expiring contracts
export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'dashboard'

    switch (action) {
      case 'dashboard':
        return NextResponse.json(await getContractorDashboard(orgId))

      case 'compliance': {
        const contractorId = url.searchParams.get('contractorId') || undefined
        const result = await getComplianceStatus(orgId, contractorId)
        return NextResponse.json({ compliance: result })
      }

      case 'payments': {
        const contractorId = url.searchParams.get('contractorId') || undefined
        const limit = parseInt(url.searchParams.get('limit') || '50')
        const result = await getPaymentHistory(orgId, contractorId, limit)
        return NextResponse.json({ payments: result })
      }

      case 'payment-report': {
        const contractorId = url.searchParams.get('contractorId') || undefined
        const startDate = url.searchParams.get('startDate') || undefined
        const endDate = url.searchParams.get('endDate') || undefined
        const result = await generatePaymentReport(orgId, { contractorId, startDate, endDate })
        return NextResponse.json(result)
      }

      case 'expiring-contracts': {
        const daysAhead = parseInt(url.searchParams.get('days') || '30')
        const result = await getContractExpiring(orgId, daysAhead)
        return NextResponse.json({ contracts: result })
      }

      case 'total-spend': {
        const contractorId = url.searchParams.get('contractorId') || undefined
        const startDate = url.searchParams.get('startDate') || undefined
        const endDate = url.searchParams.get('endDate') || undefined
        const result = await calculateTotalSpend(orgId, { contractorId, startDate, endDate })
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[GET /api/cor] Error:', error)
    return NextResponse.json({ error: error?.message || 'COR query failed' }, { status: 500 })
  }
}

// POST /api/cor - Onboard, contracts, payments, compliance, conversions
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { action } = body

    switch (action) {
      // Contractor onboarding/offboarding
      case 'onboard': {
        const { fullName, email, country, jobTitle, department, rate, rateType, currency, paymentFrequency, startDate, endDate, taxClassification, taxDocuments } = body
        if (!fullName || !email || !country || !rate || !rateType || !currency || !startDate) {
          return NextResponse.json({ error: 'fullName, email, country, rate, rateType, currency, and startDate are required' }, { status: 400 })
        }
        const result = await onboardContractor(orgId, { fullName, email, country, jobTitle, department, rate, rateType, currency, paymentFrequency, startDate, endDate, taxClassification, taxDocuments })
        return NextResponse.json(result)
      }

      case 'offboard': {
        const { contractorId, reason } = body
        if (!contractorId) return NextResponse.json({ error: 'contractorId is required' }, { status: 400 })
        const result = await offboardContractor(orgId, contractorId, reason)
        return NextResponse.json(result)
      }

      case 'bulk-onboard': {
        const { contractors } = body
        if (!contractors || !Array.isArray(contractors)) return NextResponse.json({ error: 'contractors array is required' }, { status: 400 })
        const result = await bulkOnboard(orgId, contractors)
        return NextResponse.json(result)
      }

      // Contract management
      case 'create-contract': {
        const { contractorId, contractType, title, scopeOfWork, deliverables, totalValue, currency, startDate, endDate } = body
        if (!contractorId || !contractType || !title) {
          return NextResponse.json({ error: 'contractorId, contractType, and title are required' }, { status: 400 })
        }
        const result = await createContract(orgId, { contractorId, contractType, title, scopeOfWork, deliverables, totalValue, currency, startDate, endDate })
        return NextResponse.json(result)
      }

      case 'amend-contract': {
        const { contractId, ...amendments } = body
        if (!contractId) return NextResponse.json({ error: 'contractId is required' }, { status: 400 })
        const result = await amendContract(orgId, contractId, amendments)
        return NextResponse.json(result)
      }

      case 'terminate-contract': {
        const { contractId, reason } = body
        if (!contractId) return NextResponse.json({ error: 'contractId is required' }, { status: 400 })
        const result = await terminateContract(orgId, contractId, reason)
        return NextResponse.json(result)
      }

      // Payment processing
      case 'process-payment': {
        const { contractorId, contractId, amount, currency, periodStart, periodEnd, hoursWorked, paymentMethod, invoiceUrl } = body
        if (!contractorId || !amount || !currency) {
          return NextResponse.json({ error: 'contractorId, amount, and currency are required' }, { status: 400 })
        }
        const result = await processPayment(orgId, { contractorId, contractId, amount, currency, periodStart, periodEnd, hoursWorked, paymentMethod, invoiceUrl })
        return NextResponse.json(result)
      }

      case 'approve-payment': {
        const { paymentId, approvedBy } = body
        if (!paymentId || !approvedBy) return NextResponse.json({ error: 'paymentId and approvedBy are required' }, { status: 400 })
        const result = await approvePayment(orgId, paymentId, approvedBy)
        return NextResponse.json(result)
      }

      // Compliance
      case 'assess-risk': {
        const { contractorId, responses } = body
        if (!contractorId || !responses) return NextResponse.json({ error: 'contractorId and responses are required' }, { status: 400 })
        const result = await assessMisclassificationRisk(orgId, contractorId, responses)
        return NextResponse.json(result)
      }

      case 'collect-tax-documents': {
        const { contractorId, documents } = body
        if (!contractorId || !documents) return NextResponse.json({ error: 'contractorId and documents are required' }, { status: 400 })
        const result = await collectTaxDocuments(orgId, contractorId, documents)
        return NextResponse.json(result)
      }

      case 'validate-tax-document': {
        const { contractorId, documentType, isValid, notes } = body
        if (!contractorId || !documentType || isValid === undefined) {
          return NextResponse.json({ error: 'contractorId, documentType, and isValid are required' }, { status: 400 })
        }
        const result = await validateTaxDocuments(orgId, contractorId, documentType, isValid, notes)
        return NextResponse.json(result)
      }

      // Conversion
      case 'convert-to-employee': {
        const { contractorId, department, salary, startDate, benefits } = body
        if (!contractorId || !salary || !startDate) {
          return NextResponse.json({ error: 'contractorId, salary, and startDate are required' }, { status: 400 })
        }
        const result = await convertToEmployee(orgId, contractorId, { department, salary, startDate, benefits })
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[POST /api/cor] Error:', error)
    return NextResponse.json({ error: error?.message || 'COR operation failed' }, { status: 500 })
  }
}
