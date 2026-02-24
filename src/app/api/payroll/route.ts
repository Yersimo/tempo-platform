import { NextRequest, NextResponse } from 'next/server'
import {
  calculateTax,
  processPayroll,
  generatePayStub,
  getTaxFilingRequirements,
  getPayrollAnalytics,
  validatePayrollCompliance,
  convertCurrency,
} from '@/lib/payroll-engine'

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
        const country = url.searchParams.get('country') || 'US'
        const salary = parseInt(url.searchParams.get('salary') || '0')
        const state = url.searchParams.get('state') || undefined
        const filingStatus = url.searchParams.get('filingStatus') || undefined
        if (!salary) {
          return NextResponse.json({ error: 'salary is required' }, { status: 400 })
        }
        const result = await calculateTax(country as any, salary, { state, filingStatus: filingStatus as any })
        return NextResponse.json(result)
      }

      case 'convert': {
        const amount = parseFloat(url.searchParams.get('amount') || '0')
        const from = url.searchParams.get('from') || 'USD'
        const to = url.searchParams.get('to') || 'EUR'
        if (!amount) {
          return NextResponse.json({ error: 'amount is required' }, { status: 400 })
        }
        const result = await convertCurrency(amount, from as any, to as any)
        return NextResponse.json({ amount, from, to, converted: result })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[GET /api/payroll] Error:', error)
    return NextResponse.json({ error: 'Payroll query failed' }, { status: 500 })
  }
}

// POST /api/payroll - Process payroll, generate pay stubs
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'process': {
        const { period } = body
        if (!period) {
          return NextResponse.json({ error: 'period is required (e.g., "2026-02")' }, { status: 400 })
        }
        const result = await processPayroll(orgId, period)
        return NextResponse.json(result)
      }

      case 'pay-stub': {
        const { employeeId, payrollRunId } = body
        if (!employeeId || !payrollRunId) {
          return NextResponse.json({ error: 'employeeId and payrollRunId are required' }, { status: 400 })
        }
        const result = await generatePayStub(orgId, employeeId, payrollRunId)
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[POST /api/payroll] Error:', error)
    return NextResponse.json({ error: error?.message || 'Payroll operation failed' }, { status: 500 })
  }
}
