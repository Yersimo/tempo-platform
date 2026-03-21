import { NextRequest, NextResponse } from 'next/server'
import {
  createPolicy, updatePolicy, listPolicies, deletePolicy,
  createTransaction, listTransactions, deleteTransaction,
  performArmLengthTest,
  generateMasterFile, generateLocalFile, generateCbCR,
  listReports, getReport, updateReportStatus, deleteReport,
  getComplianceSummary,
} from '@/lib/services/transfer-pricing'

// ---------------------------------------------------------------------------
// POST /api/transfer-pricing — Transfer Pricing operations
// GET  /api/transfer-pricing — Query transfer pricing data
// ---------------------------------------------------------------------------

const UUID_FORMAT = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!UUID_FORMAT.test(orgId)) return NextResponse.json({ data: [] })

    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'list-policies'
    const policyId = url.searchParams.get('policyId') || ''
    const reportId = url.searchParams.get('reportId') || ''

    switch (action) {
      case 'list-policies': {
        const policies = await listPolicies(orgId)
        return NextResponse.json({ data: policies })
      }
      case 'list-transactions': {
        const txns = await listTransactions(orgId, policyId || undefined)
        return NextResponse.json({ data: txns })
      }
      case 'arm-length-test': {
        if (!policyId) return NextResponse.json({ error: 'policyId required' }, { status: 400 })
        const result = await performArmLengthTest(policyId)
        return NextResponse.json({ data: result })
      }
      case 'list-reports': {
        const reports = await listReports(orgId)
        return NextResponse.json({ data: reports })
      }
      case 'get-report': {
        if (!reportId) return NextResponse.json({ error: 'reportId required' }, { status: 400 })
        const report = await getReport(reportId)
        return NextResponse.json({ data: report })
      }
      case 'compliance-summary': {
        const summary = await getComplianceSummary(orgId)
        return NextResponse.json({ data: summary })
      }
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[GET /api/transfer-pricing]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!UUID_FORMAT.test(orgId)) return NextResponse.json({ data: null })

    const body = await request.json()
    const { action, ...payload } = body

    switch (action) {
      case 'create-policy': {
        const policy = await createPolicy(orgId, payload)
        return NextResponse.json({ data: policy })
      }
      case 'update-policy': {
        const policy = await updatePolicy(payload.policyId, payload)
        return NextResponse.json({ data: policy })
      }
      case 'delete-policy': {
        await deletePolicy(payload.policyId)
        return NextResponse.json({ data: { success: true } })
      }
      case 'create-transaction': {
        const txn = await createTransaction(orgId, payload)
        return NextResponse.json({ data: txn })
      }
      case 'delete-transaction': {
        await deleteTransaction(payload.transactionId)
        return NextResponse.json({ data: { success: true } })
      }
      case 'generate-master-file': {
        const report = await generateMasterFile(orgId, payload.fiscalYear)
        return NextResponse.json({ data: report })
      }
      case 'generate-local-file': {
        const report = await generateLocalFile(orgId, payload.fiscalYear, payload.entity)
        return NextResponse.json({ data: report })
      }
      case 'generate-cbcr': {
        const report = await generateCbCR(orgId, payload.fiscalYear)
        return NextResponse.json({ data: report })
      }
      case 'update-report-status': {
        const report = await updateReportStatus(payload.reportId, payload.status)
        return NextResponse.json({ data: report })
      }
      case 'delete-report': {
        await deleteReport(payload.reportId)
        return NextResponse.json({ data: { success: true } })
      }
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[POST /api/transfer-pricing]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
