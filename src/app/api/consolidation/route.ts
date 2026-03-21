import { NextRequest, NextResponse } from 'next/server'
import {
  createEntityGroup,
  updateEntityGroup,
  listEntityGroups,
  getEntityGroup,
  deleteEntityGroup,
  addEntityToGroup,
  updateEntityMember,
  removeEntityFromGroup,
  listGroupMembers,
  recordIntercompanyTransaction,
  confirmIntercompanyTransaction,
  listIntercompanyTransactions,
  eliminateIntercompanyTransactions,
  generateConsolidatedReport,
  getConsolidationSummary,
  setFxRate,
  listFxRates,
  getTrialBalance,
  listConsolidationReports,
  getConsolidationReport,
  updateReportStatus,
} from '@/lib/services/consolidation-engine'

// ---------------------------------------------------------------------------
// POST /api/consolidation — Multi-entity consolidation operations
// Actions dispatched via `action` field in the request body
// ---------------------------------------------------------------------------

const UUID_FORMAT = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'list-groups'
    const groupId = url.searchParams.get('groupId') || ''
    const reportId = url.searchParams.get('reportId') || ''

    // Demo org guard
    if (!UUID_FORMAT.test(orgId)) {
      return NextResponse.json({ data: [] })
    }

    switch (action) {
      case 'list-groups': {
        const groups = await listEntityGroups(orgId)
        return NextResponse.json({ data: groups })
      }
      case 'get-group': {
        if (!groupId) return NextResponse.json({ error: 'groupId required' }, { status: 400 })
        const group = await getEntityGroup(groupId)
        return NextResponse.json({ data: group })
      }
      case 'list-members': {
        if (!groupId) return NextResponse.json({ error: 'groupId required' }, { status: 400 })
        const members = await listGroupMembers(groupId)
        return NextResponse.json({ data: members })
      }
      case 'list-ic-transactions': {
        if (!groupId) return NextResponse.json({ error: 'groupId required' }, { status: 400 })
        const periodStart = url.searchParams.get('periodStart') || undefined
        const periodEnd = url.searchParams.get('periodEnd') || undefined
        const txns = await listIntercompanyTransactions(groupId, periodStart, periodEnd)
        return NextResponse.json({ data: txns })
      }
      case 'summary': {
        if (!groupId) return NextResponse.json({ error: 'groupId required' }, { status: 400 })
        const summary = await getConsolidationSummary(groupId)
        return NextResponse.json({ data: summary })
      }
      case 'list-fx-rates': {
        if (!groupId) return NextResponse.json({ error: 'groupId required' }, { status: 400 })
        const rates = await listFxRates(groupId)
        return NextResponse.json({ data: rates })
      }
      case 'list-reports': {
        if (!groupId) return NextResponse.json({ error: 'groupId required' }, { status: 400 })
        const reports = await listConsolidationReports(groupId)
        return NextResponse.json({ data: reports })
      }
      case 'get-report': {
        if (!reportId) return NextResponse.json({ error: 'reportId required' }, { status: 400 })
        const report = await getConsolidationReport(reportId)
        return NextResponse.json({ data: report })
      }
      case 'trial-balance': {
        if (!groupId) return NextResponse.json({ error: 'groupId required' }, { status: 400 })
        const periodStart = url.searchParams.get('periodStart') || ''
        const periodEnd = url.searchParams.get('periodEnd') || ''
        if (!periodStart || !periodEnd) return NextResponse.json({ error: 'periodStart and periodEnd required' }, { status: 400 })
        const tb = await getTrialBalance(groupId, periodStart, periodEnd)
        return NextResponse.json({ data: tb })
      }
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (err: any) {
    console.error('[consolidation GET]', err)
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!UUID_FORMAT.test(orgId)) {
      return NextResponse.json({ error: 'Demo org — consolidation requires real DB' }, { status: 400 })
    }

    const body = await request.json()
    const { action } = body

    switch (action) {
      // ---- Groups ----
      case 'create-group': {
        const group = await createEntityGroup(orgId, {
          name: body.name,
          description: body.description,
          consolidationCurrency: body.consolidationCurrency,
          fiscalYearEnd: body.fiscalYearEnd,
        })
        return NextResponse.json({ data: group }, { status: 201 })
      }
      case 'update-group': {
        if (!body.groupId) return NextResponse.json({ error: 'groupId required' }, { status: 400 })
        const group = await updateEntityGroup(body.groupId, body)
        return NextResponse.json({ data: group })
      }
      case 'delete-group': {
        if (!body.groupId) return NextResponse.json({ error: 'groupId required' }, { status: 400 })
        await deleteEntityGroup(body.groupId)
        return NextResponse.json({ success: true })
      }

      // ---- Members ----
      case 'add-member': {
        if (!body.groupId) return NextResponse.json({ error: 'groupId required' }, { status: 400 })
        const member = await addEntityToGroup(body.groupId, {
          orgId: body.orgId,
          entityName: body.entityName,
          entityType: body.entityType,
          country: body.country,
          localCurrency: body.localCurrency,
          ownershipPercent: body.ownershipPercent,
          consolidationMethod: body.consolidationMethod,
        })
        return NextResponse.json({ data: member }, { status: 201 })
      }
      case 'update-member': {
        if (!body.memberId) return NextResponse.json({ error: 'memberId required' }, { status: 400 })
        const member = await updateEntityMember(body.memberId, body)
        return NextResponse.json({ data: member })
      }
      case 'remove-member': {
        if (!body.memberId) return NextResponse.json({ error: 'memberId required' }, { status: 400 })
        await removeEntityFromGroup(body.memberId)
        return NextResponse.json({ success: true })
      }

      // ---- Intercompany ----
      case 'record-ic-transaction': {
        if (!body.groupId) return NextResponse.json({ error: 'groupId required' }, { status: 400 })
        const txn = await recordIntercompanyTransaction(body.groupId, {
          fromOrgId: body.fromOrgId,
          toOrgId: body.toOrgId,
          transactionType: body.transactionType,
          description: body.description,
          amount: body.amount,
          currency: body.currency,
          date: body.date,
          referenceNumber: body.referenceNumber,
        })
        return NextResponse.json({ data: txn }, { status: 201 })
      }
      case 'confirm-ic-transaction': {
        if (!body.txnId) return NextResponse.json({ error: 'txnId required' }, { status: 400 })
        if (!body.side) return NextResponse.json({ error: 'side (from|to) required' }, { status: 400 })
        const txn = await confirmIntercompanyTransaction(body.txnId, body.side)
        return NextResponse.json({ data: txn })
      }
      case 'eliminate-ic-transactions': {
        if (!body.groupId || !body.periodStart || !body.periodEnd) {
          return NextResponse.json({ error: 'groupId, periodStart, periodEnd required' }, { status: 400 })
        }
        const eliminated = await eliminateIntercompanyTransactions(body.groupId, body.periodStart, body.periodEnd)
        return NextResponse.json({ data: { eliminatedCount: eliminated.length } })
      }

      // ---- FX Rates ----
      case 'set-fx-rate': {
        if (!body.groupId) return NextResponse.json({ error: 'groupId required' }, { status: 400 })
        const rate = await setFxRate(body.groupId, {
          fromCurrency: body.fromCurrency,
          toCurrency: body.toCurrency,
          rate: body.rate,
          rateType: body.rateType,
          effectiveDate: body.effectiveDate,
          source: body.source,
        })
        return NextResponse.json({ data: rate }, { status: 201 })
      }

      // ---- Reports ----
      case 'generate-report': {
        if (!body.groupId || !body.reportType || !body.periodStart || !body.periodEnd) {
          return NextResponse.json({ error: 'groupId, reportType, periodStart, periodEnd required' }, { status: 400 })
        }
        const employeeId = request.headers.get('x-employee-id') || undefined
        const report = await generateConsolidatedReport(
          body.groupId, body.reportType, body.periodStart, body.periodEnd, employeeId,
        )
        return NextResponse.json({ data: report }, { status: 201 })
      }
      case 'update-report-status': {
        if (!body.reportId || !body.status) {
          return NextResponse.json({ error: 'reportId and status required' }, { status: 400 })
        }
        const employeeId = request.headers.get('x-employee-id') || undefined
        const report = await updateReportStatus(body.reportId, body.status, employeeId)
        return NextResponse.json({ data: report })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (err: any) {
    console.error('[consolidation POST]', err)
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
  }
}
