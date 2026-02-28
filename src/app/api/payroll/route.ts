import { NextRequest, NextResponse } from 'next/server'
import {
  calculateTax,
  processPayroll,
  generatePayStub,
  getTaxFilingRequirements,
  getPayrollAnalytics,
  validatePayrollCompliance,
  convertCurrency,
  getPayrollEntries,
  getEmployeePayrollHistory,
  approvePayrollRun,
  markPayrollProcessing,
  markPayrollPaid,
  cancelPayrollRun,
} from '@/lib/payroll-engine'
import { payrollPostBody, calculateTaxParams, convertCurrencyParams } from '@/lib/validations/payroll'
import { formatZodError } from '@/lib/validations/common'

// GET /api/payroll - Analytics, compliance, tax info, currency conversion
export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'analytics'

    switch (action) {
      case 'analytics': {
        const result = await getPayrollAnalytics(orgId)
        return NextResponse.json(result)
      }

      case 'compliance': {
        const result = await validatePayrollCompliance(orgId)
        return NextResponse.json(result)
      }

      case 'tax-filings': {
        const countries = url.searchParams.get('countries')?.split(',') || ['US']
        const result = await getTaxFilingRequirements(countries as any[])
        return NextResponse.json({ requirements: result })
      }

      case 'calculate-tax': {
        const parsed = calculateTaxParams.safeParse({
          country: url.searchParams.get('country'),
          salary: url.searchParams.get('salary'),
          state: url.searchParams.get('state') || undefined,
          filingStatus: url.searchParams.get('filingStatus') || undefined,
        })
        if (!parsed.success) {
          return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
        }
        const { country, salary, state, filingStatus } = parsed.data
        const result = await calculateTax(country as any, salary, { state, filingStatus: filingStatus as any })
        return NextResponse.json(result)
      }

      case 'convert': {
        const parsed = convertCurrencyParams.safeParse({
          amount: url.searchParams.get('amount'),
          from: url.searchParams.get('from'),
          to: url.searchParams.get('to'),
        })
        if (!parsed.success) {
          return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
        }
        const { amount, from, to } = parsed.data
        const result = await convertCurrency(amount, from as any, to as any)
        return NextResponse.json({ amount, from, to, converted: result })
      }

      case 'entries': {
        const payrollRunId = url.searchParams.get('payrollRunId')
        if (!payrollRunId) {
          return NextResponse.json({ error: 'payrollRunId is required' }, { status: 400 })
        }
        const result = await getPayrollEntries(orgId, payrollRunId)
        return NextResponse.json(result)
      }

      case 'employee-history': {
        const employeeId = url.searchParams.get('employeeId')
        if (!employeeId) {
          return NextResponse.json({ error: 'employeeId is required' }, { status: 400 })
        }
        const result = await getEmployeePayrollHistory(orgId, employeeId)
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[GET /api/payroll] Error:', error)
    return NextResponse.json({ error: 'Payroll query failed' }, { status: 500 })
  }
}

// POST /api/payroll - Process payroll, generate pay stubs, approve/cancel runs, update status
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = payrollPostBody.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
    }

    switch (parsed.data.action) {
      case 'process': {
        const result = await processPayroll(orgId, parsed.data.period, {
          overtime: parsed.data.overtime,
          bonuses: parsed.data.bonuses,
          garnishments: parsed.data.garnishments,
        })
        return NextResponse.json(result)
      }

      case 'pay-stub': {
        const result = await generatePayStub(orgId, parsed.data.employeeId, parsed.data.payrollRunId)
        return NextResponse.json(result)
      }

      case 'approve': {
        const result = await approvePayrollRun(orgId, parsed.data.payrollRunId, parsed.data.approverId, parsed.data.approverRole)
        return NextResponse.json(result)
      }

      case 'mark-processing': {
        const result = await markPayrollProcessing(orgId, parsed.data.payrollRunId)
        return NextResponse.json(result)
      }

      case 'mark-paid': {
        const result = await markPayrollPaid(orgId, parsed.data.payrollRunId, parsed.data.paymentReference)
        return NextResponse.json(result)
      }

      case 'cancel': {
        const result = await cancelPayrollRun(orgId, parsed.data.payrollRunId, parsed.data.reason)
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: `Unknown action` }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[POST /api/payroll] Error:', error)
    return NextResponse.json({ error: error?.message || 'Payroll operation failed' }, { status: 500 })
  }
}
