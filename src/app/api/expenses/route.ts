import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq, and, desc, sql, count, sum } from 'drizzle-orm'
import { initiateApproval, getApprovalStatus } from '@/lib/services/approval-engine'
import { extractReceiptData } from '@/lib/services/receipt-ocr'
import { expensePostBody } from '@/lib/validations/expense'
import { formatZodError } from '@/lib/validations/common'

// ---------------------------------------------------------------------------
// GET /api/expenses — query expense data by action
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized: no org context' }, { status: 401 })
    }

    const url = new URL(request.url)
    const action = url.searchParams.get('action')

    if (!action) {
      return NextResponse.json({ error: 'Missing required query param: action' }, { status: 400 })
    }

    switch (action) {
      // ── 1. my-reports ──────────────────────────────────────────────────
      case 'my-reports': {
        const employeeId = url.searchParams.get('employeeId')
        if (!employeeId) {
          return NextResponse.json({ error: 'Missing required query param: employeeId' }, { status: 400 })
        }

        const reports = await db
          .select()
          .from(schema.expenseReports)
          .where(
            and(
              eq(schema.expenseReports.orgId, orgId),
              eq(schema.expenseReports.employeeId, employeeId),
            ),
          )
          .orderBy(desc(schema.expenseReports.createdAt))

        // Fetch items for all reports in one query
        const reportIds = reports.map((r) => r.id)
        const allItems = reportIds.length > 0
          ? await db
              .select()
              .from(schema.expenseItems)
              .where(sql`${schema.expenseItems.reportId} IN ${reportIds}`)
          : []

        // Group items by report ID
        const itemsByReport = new Map<string, typeof allItems>()
        for (const item of allItems) {
          const existing = itemsByReport.get(item.reportId) ?? []
          existing.push(item)
          itemsByReport.set(item.reportId, existing)
        }

        const result = reports.map((r) => ({
          ...r,
          items: itemsByReport.get(r.id) ?? [],
        }))

        return NextResponse.json({ reports: result })
      }

      // ── 2. pending-approvals ───────────────────────────────────────────
      case 'pending-approvals': {
        const managerId = url.searchParams.get('managerId')
        if (!managerId) {
          return NextResponse.json({ error: 'Missing required query param: managerId' }, { status: 400 })
        }

        // Find employees who report to this manager
        const directReports = await db
          .select({ id: schema.employees.id })
          .from(schema.employees)
          .where(
            and(
              eq(schema.employees.orgId, orgId),
              eq(schema.employees.managerId, managerId),
            ),
          )

        const directReportIds = directReports.map((e) => e.id)

        if (directReportIds.length === 0) {
          return NextResponse.json({ reports: [] })
        }

        // Find pending_approval reports from those employees
        const pendingReports = await db
          .select()
          .from(schema.expenseReports)
          .where(
            and(
              eq(schema.expenseReports.orgId, orgId),
              eq(schema.expenseReports.status, 'pending_approval'),
              sql`${schema.expenseReports.employeeId} IN ${directReportIds}`,
            ),
          )
          .orderBy(desc(schema.expenseReports.createdAt))

        // Fetch items
        const pendingIds = pendingReports.map((r) => r.id)
        const pendingItems = pendingIds.length > 0
          ? await db
              .select()
              .from(schema.expenseItems)
              .where(sql`${schema.expenseItems.reportId} IN ${pendingIds}`)
          : []

        const itemsByPending = new Map<string, typeof pendingItems>()
        for (const item of pendingItems) {
          const existing = itemsByPending.get(item.reportId) ?? []
          existing.push(item)
          itemsByPending.set(item.reportId, existing)
        }

        const result = pendingReports.map((r) => ({
          ...r,
          items: itemsByPending.get(r.id) ?? [],
        }))

        return NextResponse.json({ reports: result })
      }

      // ── 3. report-detail ───────────────────────────────────────────────
      case 'report-detail': {
        const reportId = url.searchParams.get('reportId')
        if (!reportId) {
          return NextResponse.json({ error: 'Missing required query param: reportId' }, { status: 400 })
        }

        const [report] = await db
          .select()
          .from(schema.expenseReports)
          .where(
            and(
              eq(schema.expenseReports.id, reportId),
              eq(schema.expenseReports.orgId, orgId),
            ),
          )
          .limit(1)

        if (!report) {
          return NextResponse.json({ error: 'Report not found' }, { status: 404 })
        }

        const items = await db
          .select()
          .from(schema.expenseItems)
          .where(eq(schema.expenseItems.reportId, reportId))

        // Get approval status if the report has been submitted
        let approvalStatus = null
        if (report.status !== 'draft') {
          approvalStatus = await getApprovalStatus(orgId, 'expense_report', reportId)
        }

        return NextResponse.json({
          report: {
            ...report,
            items,
            approvalStatus,
          },
        })
      }

      // ── 4. policies ───────────────────────────────────────────────────
      case 'policies': {
        const policies = await db
          .select()
          .from(schema.expensePolicies)
          .where(
            and(
              eq(schema.expensePolicies.orgId, orgId),
              eq(schema.expensePolicies.isActive, true),
            ),
          )
          .orderBy(schema.expensePolicies.name)

        return NextResponse.json({ policies })
      }

      // ── 5. analytics ──────────────────────────────────────────────────
      case 'analytics': {
        // Total by status
        const byStatus = await db
          .select({
            status: schema.expenseReports.status,
            count: count(),
            total: sum(schema.expenseReports.totalAmount),
          })
          .from(schema.expenseReports)
          .where(eq(schema.expenseReports.orgId, orgId))
          .groupBy(schema.expenseReports.status)

        // Total by category (across all items for this org's reports)
        const byCategory = await db
          .select({
            category: schema.expenseItems.category,
            count: count(),
            total: sum(schema.expenseItems.amount),
          })
          .from(schema.expenseItems)
          .innerJoin(
            schema.expenseReports,
            eq(schema.expenseItems.reportId, schema.expenseReports.id),
          )
          .where(eq(schema.expenseReports.orgId, orgId))
          .groupBy(schema.expenseItems.category)

        // Monthly totals (last 12 months)
        const byMonth = await db
          .select({
            month: sql<string>`to_char(${schema.expenseReports.createdAt}, 'YYYY-MM')`,
            count: count(),
            total: sum(schema.expenseReports.totalAmount),
          })
          .from(schema.expenseReports)
          .where(
            and(
              eq(schema.expenseReports.orgId, orgId),
              sql`${schema.expenseReports.createdAt} >= NOW() - INTERVAL '12 months'`,
            ),
          )
          .groupBy(sql`to_char(${schema.expenseReports.createdAt}, 'YYYY-MM')`)
          .orderBy(sql`to_char(${schema.expenseReports.createdAt}, 'YYYY-MM')`)

        return NextResponse.json({
          analytics: {
            byStatus,
            byCategory,
            byMonth,
          },
        })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[GET /api/expenses] Error:', error)
    return NextResponse.json({ error: 'Expense query failed' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// POST /api/expenses — expense mutations
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized: no org context' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = expensePostBody.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
    }

    switch (parsed.data.action) {
      // ── 1. create-report ───────────────────────────────────────────────
      case 'create-report': {
        const { employeeId, title, currency } = parsed.data

        // Verify the employee belongs to this org
        const [employee] = await db
          .select({ id: schema.employees.id })
          .from(schema.employees)
          .where(
            and(
              eq(schema.employees.id, employeeId),
              eq(schema.employees.orgId, orgId),
            ),
          )
          .limit(1)

        if (!employee) {
          return NextResponse.json({ error: 'Employee not found in this organization' }, { status: 404 })
        }

        const [report] = await db
          .insert(schema.expenseReports)
          .values({
            orgId,
            employeeId,
            title,
            totalAmount: 0,
            currency,
            status: 'draft',
          })
          .returning()

        return NextResponse.json({ report }, { status: 201 })
      }

      // ── 2. add-item ───────────────────────────────────────────────────
      case 'add-item': {
        const { reportId, category, description, amount, receiptUrl } = parsed.data

        // Verify report exists, belongs to this org, and is in draft status
        const [report] = await db
          .select()
          .from(schema.expenseReports)
          .where(
            and(
              eq(schema.expenseReports.id, reportId),
              eq(schema.expenseReports.orgId, orgId),
            ),
          )
          .limit(1)

        if (!report) {
          return NextResponse.json({ error: 'Report not found' }, { status: 404 })
        }

        if (report.status !== 'draft') {
          return NextResponse.json(
            { error: 'Cannot add items to a report that is not in draft status' },
            { status: 400 },
          )
        }

        // Validate against expense policy limits for this category
        const [policy] = await db
          .select()
          .from(schema.expensePolicies)
          .where(
            and(
              eq(schema.expensePolicies.orgId, orgId),
              eq(schema.expensePolicies.category, category),
              eq(schema.expensePolicies.isActive, true),
            ),
          )
          .limit(1)

        if (policy) {
          // Check per-item maximum
          if (policy.maxAmount !== null && amount > policy.maxAmount) {
            return NextResponse.json(
              {
                error: `Amount ${amount} exceeds policy limit of ${policy.maxAmount} for category "${category}"`,
                policyId: policy.id,
              },
              { status: 400 },
            )
          }

          // Check receipt requirement
          if (policy.requiresReceipt && !receiptUrl) {
            return NextResponse.json(
              {
                error: `A receipt is required for category "${category}" per expense policy`,
                policyId: policy.id,
              },
              { status: 400 },
            )
          }
        }

        const [item] = await db
          .insert(schema.expenseItems)
          .values({
            reportId,
            category,
            description: description ?? null,
            amount,
            receiptUrl: receiptUrl ?? null,
          })
          .returning()

        // Update report total
        const totalResult = await db
          .select({ total: sum(schema.expenseItems.amount) })
          .from(schema.expenseItems)
          .where(eq(schema.expenseItems.reportId, reportId))

        const newTotal = Number(totalResult[0]?.total ?? 0)

        await db
          .update(schema.expenseReports)
          .set({ totalAmount: newTotal })
          .where(eq(schema.expenseReports.id, reportId))

        return NextResponse.json({ item, reportTotal: newTotal }, { status: 201 })
      }

      // ── 3. upload-receipt ──────────────────────────────────────────────
      case 'upload-receipt': {
        const { reportId, itemId, receiptUrl } = parsed.data

        // Verify the report belongs to this org
        const [report] = await db
          .select({ id: schema.expenseReports.id })
          .from(schema.expenseReports)
          .where(
            and(
              eq(schema.expenseReports.id, reportId),
              eq(schema.expenseReports.orgId, orgId),
            ),
          )
          .limit(1)

        if (!report) {
          return NextResponse.json({ error: 'Report not found' }, { status: 404 })
        }

        // Verify the item belongs to this report
        const [item] = await db
          .select()
          .from(schema.expenseItems)
          .where(
            and(
              eq(schema.expenseItems.id, itemId),
              eq(schema.expenseItems.reportId, reportId),
            ),
          )
          .limit(1)

        if (!item) {
          return NextResponse.json({ error: 'Expense item not found in this report' }, { status: 404 })
        }

        // Run OCR extraction
        const ocrResult = await extractReceiptData(receiptUrl)

        // Update the item with receipt URL and OCR data
        const [updatedItem] = await db
          .update(schema.expenseItems)
          .set({
            receiptUrl,
            ocrData: ocrResult,
          })
          .where(eq(schema.expenseItems.id, itemId))
          .returning()

        return NextResponse.json({ item: updatedItem, ocrResult })
      }

      // ── 4. submit ─────────────────────────────────────────────────────
      case 'submit': {
        const { reportId } = parsed.data

        const [report] = await db
          .select()
          .from(schema.expenseReports)
          .where(
            and(
              eq(schema.expenseReports.id, reportId),
              eq(schema.expenseReports.orgId, orgId),
            ),
          )
          .limit(1)

        if (!report) {
          return NextResponse.json({ error: 'Report not found' }, { status: 404 })
        }

        if (report.status !== 'draft') {
          return NextResponse.json(
            { error: 'Only draft reports can be submitted' },
            { status: 400 },
          )
        }

        // Recalculate total from items
        const totalResult = await db
          .select({ total: sum(schema.expenseItems.amount) })
          .from(schema.expenseItems)
          .where(eq(schema.expenseItems.reportId, reportId))

        const calculatedTotal = Number(totalResult[0]?.total ?? 0)

        if (calculatedTotal === 0) {
          return NextResponse.json(
            { error: 'Cannot submit a report with no items' },
            { status: 400 },
          )
        }

        // Check if auto-approve threshold applies
        // Find the most permissive auto-approve policy for this org
        const autoApprovePolicies = await db
          .select({ autoApproveBelow: schema.expensePolicies.autoApproveBelow })
          .from(schema.expensePolicies)
          .where(
            and(
              eq(schema.expensePolicies.orgId, orgId),
              eq(schema.expensePolicies.isActive, true),
              sql`${schema.expensePolicies.autoApproveBelow} IS NOT NULL`,
            ),
          )

        const maxAutoApprove = autoApprovePolicies.reduce(
          (max, p) => Math.max(max, p.autoApproveBelow ?? 0),
          0,
        )

        const now = new Date()

        if (maxAutoApprove > 0 && calculatedTotal <= maxAutoApprove) {
          // Auto-approve: skip approval chain
          const [updatedReport] = await db
            .update(schema.expenseReports)
            .set({
              status: 'approved',
              totalAmount: calculatedTotal,
              submittedAt: now,
            })
            .where(eq(schema.expenseReports.id, reportId))
            .returning()

          return NextResponse.json({
            report: updatedReport,
            autoApproved: true,
            message: `Report auto-approved (total ${calculatedTotal} is below threshold ${maxAutoApprove})`,
          })
        }

        // Initiate approval chain
        let approvalSteps = null
        try {
          // Update status to submitted first
          await db
            .update(schema.expenseReports)
            .set({
              status: 'submitted',
              totalAmount: calculatedTotal,
              submittedAt: now,
            })
            .where(eq(schema.expenseReports.id, reportId))

          approvalSteps = await initiateApproval(
            orgId,
            'expense_report',
            reportId,
            calculatedTotal,
          )

          // Move to pending_approval since approval chain was created
          await db
            .update(schema.expenseReports)
            .set({ status: 'pending_approval' })
            .where(eq(schema.expenseReports.id, reportId))
        } catch (approvalErr: any) {
          // If no approval chain is configured, leave as submitted
          console.warn('[POST /api/expenses] Approval chain not found, leaving as submitted:', approvalErr?.message)
        }

        const [finalReport] = await db
          .select()
          .from(schema.expenseReports)
          .where(eq(schema.expenseReports.id, reportId))
          .limit(1)

        return NextResponse.json({
          report: finalReport,
          autoApproved: false,
          approvalSteps,
        })
      }

      // ── 5. approve ────────────────────────────────────────────────────
      case 'approve': {
        const { reportId, approverId } = parsed.data

        const [report] = await db
          .select()
          .from(schema.expenseReports)
          .where(
            and(
              eq(schema.expenseReports.id, reportId),
              eq(schema.expenseReports.orgId, orgId),
            ),
          )
          .limit(1)

        if (!report) {
          return NextResponse.json({ error: 'Report not found' }, { status: 404 })
        }

        if (report.status !== 'pending_approval' && report.status !== 'submitted') {
          return NextResponse.json(
            { error: `Report cannot be approved in "${report.status}" status` },
            { status: 400 },
          )
        }

        // Verify the approver is the employee's manager or an admin
        const [approver] = await db
          .select({ id: schema.employees.id, role: schema.employees.role })
          .from(schema.employees)
          .where(
            and(
              eq(schema.employees.id, approverId),
              eq(schema.employees.orgId, orgId),
            ),
          )
          .limit(1)

        if (!approver) {
          return NextResponse.json({ error: 'Approver not found in this organization' }, { status: 404 })
        }

        // Check: approver must be manager of the employee or an admin/owner
        const isAdminOrOwner = approver.role === 'admin' || approver.role === 'owner'

        if (!isAdminOrOwner) {
          const [employee] = await db
            .select({ managerId: schema.employees.managerId })
            .from(schema.employees)
            .where(eq(schema.employees.id, report.employeeId))
            .limit(1)

          if (!employee || employee.managerId !== approverId) {
            return NextResponse.json(
              { error: 'Only the employee\'s manager or an admin can approve this report' },
              { status: 403 },
            )
          }
        }

        const [updatedReport] = await db
          .update(schema.expenseReports)
          .set({
            status: 'approved',
            approvedBy: approverId,
          })
          .where(eq(schema.expenseReports.id, reportId))
          .returning()

        return NextResponse.json({ report: updatedReport })
      }

      // ── 6. reject ─────────────────────────────────────────────────────
      case 'reject': {
        const { reportId, approverId, reason } = parsed.data

        const [report] = await db
          .select()
          .from(schema.expenseReports)
          .where(
            and(
              eq(schema.expenseReports.id, reportId),
              eq(schema.expenseReports.orgId, orgId),
            ),
          )
          .limit(1)

        if (!report) {
          return NextResponse.json({ error: 'Report not found' }, { status: 404 })
        }

        if (report.status !== 'pending_approval' && report.status !== 'submitted') {
          return NextResponse.json(
            { error: `Report cannot be rejected in "${report.status}" status` },
            { status: 400 },
          )
        }

        // Verify the approver is the employee's manager or an admin
        const [approver] = await db
          .select({ id: schema.employees.id, role: schema.employees.role })
          .from(schema.employees)
          .where(
            and(
              eq(schema.employees.id, approverId),
              eq(schema.employees.orgId, orgId),
            ),
          )
          .limit(1)

        if (!approver) {
          return NextResponse.json({ error: 'Approver not found in this organization' }, { status: 404 })
        }

        const isAdminOrOwner = approver.role === 'admin' || approver.role === 'owner'

        if (!isAdminOrOwner) {
          const [employee] = await db
            .select({ managerId: schema.employees.managerId })
            .from(schema.employees)
            .where(eq(schema.employees.id, report.employeeId))
            .limit(1)

          if (!employee || employee.managerId !== approverId) {
            return NextResponse.json(
              { error: 'Only the employee\'s manager or an admin can reject this report' },
              { status: 403 },
            )
          }
        }

        // Update report status to rejected and store reason in metadata
        // (The schema does not have a rejectionReason column, so we return it in the response
        // and the caller should also log it to the audit trail.)
        const [updatedReport] = await db
          .update(schema.expenseReports)
          .set({ status: 'rejected' })
          .where(eq(schema.expenseReports.id, reportId))
          .returning()

        return NextResponse.json({ report: updatedReport, rejectionReason: reason })
      }

      // ── 7. mark-reimbursed ────────────────────────────────────────────
      case 'mark-reimbursed': {
        const { reportId, reference } = parsed.data

        const [report] = await db
          .select()
          .from(schema.expenseReports)
          .where(
            and(
              eq(schema.expenseReports.id, reportId),
              eq(schema.expenseReports.orgId, orgId),
            ),
          )
          .limit(1)

        if (!report) {
          return NextResponse.json({ error: 'Report not found' }, { status: 404 })
        }

        if (report.status !== 'approved') {
          return NextResponse.json(
            { error: 'Only approved reports can be marked as reimbursed' },
            { status: 400 },
          )
        }

        const [updatedReport] = await db
          .update(schema.expenseReports)
          .set({ status: 'reimbursed' })
          .where(eq(schema.expenseReports.id, reportId))
          .returning()

        return NextResponse.json({
          report: updatedReport,
          reimbursementReference: reference,
        })
      }

      // ── 8. create-policy ──────────────────────────────────────────────
      case 'create-policy': {
        const {
          name,
          category,
          maxAmount,
          maxDailyAmount,
          requiresReceipt,
          requiresApproval,
          autoApproveBelow,
          allowedRoles,
        } = parsed.data

        const [policy] = await db
          .insert(schema.expensePolicies)
          .values({
            orgId,
            name,
            category,
            maxAmount: maxAmount ?? null,
            maxDailyAmount: maxDailyAmount ?? null,
            requiresReceipt: requiresReceipt ?? true,
            requiresApproval: requiresApproval ?? true,
            autoApproveBelow: autoApproveBelow ?? null,
            allowedRoles: allowedRoles ?? null,
          })
          .returning()

        return NextResponse.json({ policy }, { status: 201 })
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[POST /api/expenses] Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Expense operation failed' },
      { status: 500 },
    )
  }
}
