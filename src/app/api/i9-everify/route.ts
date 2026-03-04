import { NextRequest, NextResponse } from 'next/server'
import {
  createI9Form,
  submitSection1,
  verifySection2Documents,
  submitToEVerify,
  checkEVerifyStatus,
  handleTentativeNonConfirmation,
  getComplianceReport,
  getReverificationAlerts,
  bulkSubmitEVerify,
  listI9Forms,
  getAcceptableDocuments,
} from '@/lib/services/i9-everify'

// GET /api/i9-everify - List forms, check status, compliance reports, reverification alerts
export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'list'

    switch (action) {
      case 'list': {
        const status = url.searchParams.get('status') as any
        const employeeId = url.searchParams.get('employeeId') || undefined
        const limit = parseInt(url.searchParams.get('limit') || '50')
        const offset = parseInt(url.searchParams.get('offset') || '0')
        const result = await listI9Forms(orgId, { status, employeeId, limit, offset })
        return NextResponse.json(result)
      }

      case 'everify-status': {
        const caseId = url.searchParams.get('caseId')
        if (!caseId) {
          return NextResponse.json({ error: 'caseId is required' }, { status: 400 })
        }
        const result = await checkEVerifyStatus(orgId, caseId)
        return NextResponse.json(result)
      }

      case 'compliance-report': {
        const result = await getComplianceReport(orgId)
        return NextResponse.json(result)
      }

      case 'reverification-alerts': {
        const daysAhead = parseInt(url.searchParams.get('daysAhead') || '90')
        const result = await getReverificationAlerts(orgId, daysAhead)
        return NextResponse.json(result)
      }

      case 'acceptable-documents': {
        const category = url.searchParams.get('category') as any
        const result = getAcceptableDocuments(category)
        return NextResponse.json({ documents: result })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[GET /api/i9-everify] Error:', error)
    const message = error instanceof Error ? error.message : 'I-9/E-Verify operation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST /api/i9-everify - Create forms, submit sections, E-Verify operations
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'create': {
        const { employeeId, hireDate } = body
        if (!employeeId || !hireDate) {
          return NextResponse.json({ error: 'employeeId and hireDate are required' }, { status: 400 })
        }
        const result = await createI9Form(orgId, employeeId, hireDate)
        return NextResponse.json(result, { status: 201 })
      }

      case 'submit-section1': {
        const { formId, data } = body
        if (!formId || !data) {
          return NextResponse.json({ error: 'formId and data are required' }, { status: 400 })
        }
        const result = await submitSection1(orgId, formId, data)
        return NextResponse.json(result)
      }

      case 'verify-section2': {
        const { formId, verifiedBy, data } = body
        if (!formId || !verifiedBy || !data) {
          return NextResponse.json({ error: 'formId, verifiedBy, and data are required' }, { status: 400 })
        }
        const result = await verifySection2Documents(orgId, formId, verifiedBy, data)
        return NextResponse.json(result)
      }

      case 'submit-everify': {
        const { formId, submittedBy } = body
        if (!formId || !submittedBy) {
          return NextResponse.json({ error: 'formId and submittedBy are required' }, { status: 400 })
        }
        const result = await submitToEVerify(orgId, formId, submittedBy)
        return NextResponse.json(result)
      }

      case 'handle-tnc': {
        const { caseId, tncAction, employeeNotified } = body
        if (!caseId || !tncAction) {
          return NextResponse.json({ error: 'caseId and tncAction (contest|accept) are required' }, { status: 400 })
        }
        if (tncAction !== 'contest' && tncAction !== 'accept') {
          return NextResponse.json({ error: 'tncAction must be "contest" or "accept"' }, { status: 400 })
        }
        const result = await handleTentativeNonConfirmation(orgId, caseId, tncAction, !!employeeNotified)
        return NextResponse.json(result)
      }

      case 'bulk-submit-everify': {
        const { formIds, submittedBy } = body
        if (!formIds?.length || !submittedBy) {
          return NextResponse.json({ error: 'formIds and submittedBy are required' }, { status: 400 })
        }
        const result = await bulkSubmitEVerify(orgId, formIds, submittedBy)
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[POST /api/i9-everify] Error:', error)
    const message = error instanceof Error ? error.message : 'I-9/E-Verify operation failed'
    const status = error instanceof Error && 'code' in error ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

// PUT /api/i9-everify - Update I-9 form or E-Verify case
export async function PUT(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'update-case-status': {
        const { caseId, status: newStatus, verificationResult, photoMatchResult, closureReason } = body
        if (!caseId || !newStatus) {
          return NextResponse.json({ error: 'caseId and status are required' }, { status: 400 })
        }

        const { db } = await import('@/lib/db')
        const { schema } = await import('@/lib/db')
        const { eq, and } = await import('drizzle-orm')

        const updates: Record<string, unknown> = {
          status: newStatus,
          updatedAt: new Date(),
        }
        if (verificationResult) updates.verificationResult = verificationResult
        if (photoMatchResult) updates.photoMatchResult = photoMatchResult
        if (closureReason) updates.closureReason = closureReason
        if (newStatus === 'close_case_authorized' || newStatus === 'close_case_unauthorized' || newStatus === 'final_nonconfirmation') {
          updates.closedAt = new Date()
        }
        if (newStatus === 'tentative_nonconfirmation') {
          const tncDate = new Date()
          updates.tncIssueDate = tncDate.toISOString().split('T')[0]
        }

        const result = await db.update(schema.everifyCases)
          .set(updates)
          .where(and(
            eq(schema.everifyCases.id, caseId),
            eq(schema.everifyCases.orgId, orgId)
          ))
          .returning()

        if (!result.length) {
          return NextResponse.json({ error: 'E-Verify case not found' }, { status: 404 })
        }

        // Update associated I-9 form status
        const everifyCase = result[0]
        let i9Status: string | null = null
        if (newStatus === 'employment_authorized' || newStatus === 'close_case_authorized') {
          i9Status = 'verified'
        } else if (newStatus === 'tentative_nonconfirmation') {
          i9Status = 'tnc_issued'
        } else if (newStatus === 'final_nonconfirmation' || newStatus === 'close_case_unauthorized') {
          i9Status = 'final_nonconfirmation'
        }

        if (i9Status) {
          await db.update(schema.i9Forms)
            .set({ status: i9Status as any, updatedAt: new Date() })
            .where(eq(schema.i9Forms.id, everifyCase.i9FormId))
        }

        return NextResponse.json({ case: result[0] })
      }

      case 'update-reverification': {
        const { formId, reverificationDate, reverificationDocType, reverificationDocNumber, reverificationExpirationDate } = body
        if (!formId) {
          return NextResponse.json({ error: 'formId is required' }, { status: 400 })
        }

        const { db } = await import('@/lib/db')
        const { schema } = await import('@/lib/db')
        const { eq, and } = await import('drizzle-orm')

        const updates: Record<string, unknown> = { updatedAt: new Date() }
        if (reverificationDate) updates.reverificationDate = reverificationDate
        if (reverificationDocType) updates.reverificationDocType = reverificationDocType
        if (reverificationDocNumber) updates.reverificationDocNumber = reverificationDocNumber
        if (reverificationExpirationDate) updates.reverificationExpirationDate = reverificationExpirationDate

        const result = await db.update(schema.i9Forms)
          .set(updates)
          .where(and(
            eq(schema.i9Forms.id, formId),
            eq(schema.i9Forms.orgId, orgId)
          ))
          .returning()

        if (!result.length) {
          return NextResponse.json({ error: 'I-9 form not found' }, { status: 404 })
        }

        return NextResponse.json({ form: result[0] })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[PUT /api/i9-everify] Error:', error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}

// DELETE /api/i9-everify - Delete a not-started I-9 form
export async function DELETE(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const formId = url.searchParams.get('formId')
    if (!formId) {
      return NextResponse.json({ error: 'formId is required' }, { status: 400 })
    }

    const { db } = await import('@/lib/db')
    const { schema } = await import('@/lib/db')
    const { eq, and } = await import('drizzle-orm')

    // Only allow deleting forms that haven't been started
    const forms = await db.select()
      .from(schema.i9Forms)
      .where(and(
        eq(schema.i9Forms.id, formId),
        eq(schema.i9Forms.orgId, orgId)
      ))

    if (!forms.length) {
      return NextResponse.json({ error: 'I-9 form not found' }, { status: 404 })
    }

    const form = forms[0]
    if (form.status !== 'not_started' && form.status !== 'section1_pending') {
      return NextResponse.json(
        { error: 'Only forms that have not been completed can be deleted. Completed forms must be retained for compliance.' },
        { status: 400 }
      )
    }

    await db.delete(schema.i9Forms).where(eq(schema.i9Forms.id, formId))
    return NextResponse.json({ deleted: true, formId })
  } catch (error) {
    console.error('[DELETE /api/i9-everify] Error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
