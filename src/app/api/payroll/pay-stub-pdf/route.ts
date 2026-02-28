import { NextRequest, NextResponse } from 'next/server'
import { generatePayStub } from '@/lib/payroll-engine'
import { generatePayStubPDF } from '@/lib/payroll/pay-stub-pdf'

export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const employeeId = url.searchParams.get('employeeId')
    const payrollRunId = url.searchParams.get('payrollRunId')

    if (!employeeId || !payrollRunId) {
      return NextResponse.json(
        { error: 'employeeId and payrollRunId query params are required' },
        { status: 400 },
      )
    }

    const companyName = url.searchParams.get('companyName') || undefined

    // Generate the pay stub data
    const stub = await generatePayStub(orgId, employeeId, payrollRunId)

    // Generate the PDF
    const pdfBytes = await generatePayStubPDF(stub, companyName)

    // Build a filename from employee name + period
    const safeName = stub.employeeName.replace(/[^a-zA-Z0-9]/g, '_')
    const safePeriod = stub.period.replace(/[^a-zA-Z0-9-]/g, '_')
    const filename = `pay-stub_${safeName}_${safePeriod}.pdf`

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(pdfBytes.byteLength),
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    })
  } catch (error: any) {
    console.error('[GET /api/payroll/pay-stub-pdf] Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to generate pay stub PDF' },
      { status: 500 },
    )
  }
}
