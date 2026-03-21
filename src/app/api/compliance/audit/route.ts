import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import {
  getComplianceDashboard,
  generateSOC2Report,
  exportAuditLog,
  verifyAuditIntegrity,
  enforceRetentionPolicy,
  generateAccessReviewReport,
  generateChangeManagementReport,
  type ExportFormat,
  type TrustCategoryScore,
} from '@/lib/services/audit-export'
import type { TrustServiceCategory } from '@/lib/soc2-compliance'

// GET /api/compliance/audit — compliance dashboard data
export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const view = url.searchParams.get('view') || 'dashboard'

    switch (view) {
      case 'dashboard': {
        const data = await getComplianceDashboard(orgId)
        return NextResponse.json(data)
      }

      case 'findings': {
        const findings = await db
          .select()
          .from(schema.complianceFindings)
          .where(eq(schema.complianceFindings.orgId, orgId))
          .orderBy(desc(schema.complianceFindings.createdAt))
        return NextResponse.json({ findings })
      }

      case 'retention-policies': {
        const policies = await db
          .select()
          .from(schema.retentionPolicies)
          .where(eq(schema.retentionPolicies.orgId, orgId))
        return NextResponse.json({ policies })
      }

      case 'hash-chain': {
        const entries = await db
          .select()
          .from(schema.auditHashChain)
          .where(eq(schema.auditHashChain.orgId, orgId))
          .orderBy(desc(schema.auditHashChain.sequenceNumber))
          .limit(100)
        return NextResponse.json({ entries, total: entries.length })
      }

      default:
        return NextResponse.json({ error: `Unknown view: ${view}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[GET /api/compliance/audit] Error:', error)
    return NextResponse.json({ error: 'Failed to load compliance data' }, { status: 500 })
  }
}

// POST /api/compliance/audit — actions
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'generate-soc2-report': {
        const { periodStart, periodEnd, trustCategories } = body
        if (!periodStart || !periodEnd) {
          return NextResponse.json({ error: 'periodStart and periodEnd are required' }, { status: 400 })
        }
        const report = await generateSOC2Report(
          orgId,
          periodStart,
          periodEnd,
          trustCategories as TrustServiceCategory[] | undefined
        )
        return NextResponse.json(report)
      }

      case 'export-audit': {
        const { format, startDate, endDate, entityTypes, actions: auditActions, includeHash } = body
        if (!format || !['csv', 'json', 'pdf'].includes(format)) {
          return NextResponse.json({ error: 'format must be csv, json, or pdf' }, { status: 400 })
        }
        const result = await exportAuditLog(orgId, {
          format: format as ExportFormat,
          startDate,
          endDate,
          entityTypes,
          actions: auditActions,
          includeHash,
        })
        return new NextResponse(result.data, {
          headers: {
            'Content-Type': result.contentType,
            'Content-Disposition': `attachment; filename="${result.filename}"`,
          },
        })
      }

      case 'verify-integrity': {
        const { startDate, endDate } = body
        const report = await verifyAuditIntegrity(orgId, startDate, endDate)
        return NextResponse.json(report)
      }

      case 'enforce-retention': {
        const result = await enforceRetentionPolicy(orgId)
        return NextResponse.json(result)
      }

      case 'access-review-report': {
        const { periodStart, periodEnd } = body
        if (!periodStart || !periodEnd) {
          return NextResponse.json({ error: 'periodStart and periodEnd are required' }, { status: 400 })
        }
        const report = await generateAccessReviewReport(orgId, periodStart, periodEnd)
        return NextResponse.json(report)
      }

      case 'change-management-report': {
        const { periodStart, periodEnd } = body
        if (!periodStart || !periodEnd) {
          return NextResponse.json({ error: 'periodStart and periodEnd are required' }, { status: 400 })
        }
        const report = await generateChangeManagementReport(orgId, periodStart, periodEnd)
        return NextResponse.json(report)
      }

      // CRUD for retention policies
      case 'create-retention-policy': {
        const { entityType, retentionDays, archiveAfterDays, deleteAfterDays } = body
        if (!entityType || !retentionDays) {
          return NextResponse.json({ error: 'entityType and retentionDays are required' }, { status: 400 })
        }
        const [policy] = await db
          .insert(schema.retentionPolicies)
          .values({ orgId, entityType, retentionDays, archiveAfterDays, deleteAfterDays })
          .returning()
        return NextResponse.json(policy, { status: 201 })
      }

      case 'update-retention-policy': {
        const { id, retentionDays: rDays, archiveAfterDays: aDays, deleteAfterDays: dDays, isActive } = body
        if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
        const updates: Record<string, unknown> = {}
        if (rDays !== undefined) updates.retentionDays = rDays
        if (aDays !== undefined) updates.archiveAfterDays = aDays
        if (dDays !== undefined) updates.deleteAfterDays = dDays
        if (isActive !== undefined) updates.isActive = isActive
        const [updated] = await db
          .update(schema.retentionPolicies)
          .set(updates)
          .where(and(eq(schema.retentionPolicies.id, id), eq(schema.retentionPolicies.orgId, orgId)))
          .returning()
        return NextResponse.json(updated)
      }

      case 'delete-retention-policy': {
        const { id: deleteId } = body
        if (!deleteId) return NextResponse.json({ error: 'id is required' }, { status: 400 })
        await db
          .delete(schema.retentionPolicies)
          .where(and(eq(schema.retentionPolicies.id, deleteId), eq(schema.retentionPolicies.orgId, orgId)))
        return NextResponse.json({ success: true })
      }

      // CRUD for compliance findings
      case 'create-finding': {
        const { findingType, trustCategory, title, description, severity, remediationPlan, dueDate, assignedTo } = body
        if (!findingType || !trustCategory || !title || !description || !severity) {
          return NextResponse.json({ error: 'findingType, trustCategory, title, description, and severity are required' }, { status: 400 })
        }
        const [finding] = await db
          .insert(schema.complianceFindings)
          .values({ orgId, findingType, trustCategory, title, description, severity, remediationPlan, dueDate, assignedTo })
          .returning()
        return NextResponse.json(finding, { status: 201 })
      }

      case 'update-finding': {
        const { id: findingId, ...findingUpdates } = body
        if (!findingId) return NextResponse.json({ error: 'id is required' }, { status: 400 })
        // Only allow specific fields to be updated
        const allowed: Record<string, unknown> = {}
        for (const key of ['status', 'severity', 'remediationPlan', 'dueDate', 'assignedTo', 'title', 'description']) {
          if (findingUpdates[key] !== undefined) allowed[key] = findingUpdates[key]
        }
        if (findingUpdates.status === 'remediated') {
          allowed.resolvedAt = new Date()
        }
        allowed.updatedAt = new Date()
        const [updatedFinding] = await db
          .update(schema.complianceFindings)
          .set(allowed)
          .where(and(eq(schema.complianceFindings.id, findingId), eq(schema.complianceFindings.orgId, orgId)))
          .returning()
        return NextResponse.json(updatedFinding)
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[POST /api/compliance/audit] Error:', error)
    return NextResponse.json({ error: 'Compliance operation failed' }, { status: 500 })
  }
}
