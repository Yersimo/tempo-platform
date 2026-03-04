import { NextRequest, NextResponse } from 'next/server'
import {
  setupPeoConfiguration,
  enrollEmployee,
  terminateCoEmployment,
  syncPeoData,
  getWorkersCompCodes,
  getPeoComplianceStatus,
  generatePeoReport,
  managePeoServices,
  calculateAdminFees,
  listPeoConfigurations,
  addWorkersCompCode,
} from '@/lib/services/peo-service'

// GET /api/peo - List configurations, compliance status, workers comp codes, reports, admin fees
export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'list'

    switch (action) {
      case 'list': {
        const status = url.searchParams.get('status') as any
        const result = await listPeoConfigurations(orgId, status ? { status } : undefined)
        return NextResponse.json(result)
      }

      case 'compliance': {
        const configId = url.searchParams.get('configId')
        if (!configId) {
          return NextResponse.json({ error: 'configId is required' }, { status: 400 })
        }
        const result = await getPeoComplianceStatus(orgId, configId)
        return NextResponse.json(result)
      }

      case 'workers-comp-codes': {
        const configId = url.searchParams.get('configId')
        if (!configId) {
          return NextResponse.json({ error: 'configId is required' }, { status: 400 })
        }
        const state = url.searchParams.get('state') || undefined
        const result = await getWorkersCompCodes(orgId, configId, state)
        return NextResponse.json(result)
      }

      case 'report': {
        const configId = url.searchParams.get('configId')
        const period = url.searchParams.get('period')
        if (!configId || !period) {
          return NextResponse.json({ error: 'configId and period are required' }, { status: 400 })
        }
        const result = await generatePeoReport(orgId, configId, period)
        return NextResponse.json(result)
      }

      case 'admin-fees': {
        const configId = url.searchParams.get('configId')
        const period = url.searchParams.get('period')
        if (!configId || !period) {
          return NextResponse.json({ error: 'configId and period are required' }, { status: 400 })
        }
        const result = await calculateAdminFees(orgId, configId, period)
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[GET /api/peo] Error:', error)
    const message = error instanceof Error ? error.message : 'PEO operation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST /api/peo - Setup, enroll, terminate, sync, manage services, add WC codes
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'setup': {
        const {
          peoProviderName, serviceType, contractStartDate, contractEndDate,
          fein, stateRegistrations, services, adminFeeStructure,
          workersCompPolicy, payrollSchedule, primaryContactName,
          primaryContactEmail, primaryContactPhone, notes,
        } = body
        const result = await setupPeoConfiguration(orgId, {
          peoProviderName,
          serviceType,
          contractStartDate,
          contractEndDate,
          fein,
          stateRegistrations,
          services,
          adminFeeStructure,
          workersCompPolicy,
          payrollSchedule,
          primaryContactName,
          primaryContactEmail,
          primaryContactPhone,
          notes,
        })
        return NextResponse.json(result, { status: 201 })
      }

      case 'enroll': {
        const { configId, employeeId, workState, workCountry, workersCompCode, workersCompDescription } = body
        if (!configId || !employeeId) {
          return NextResponse.json({ error: 'configId and employeeId are required' }, { status: 400 })
        }
        const result = await enrollEmployee(orgId, configId, {
          employeeId,
          workState,
          workCountry,
          workersCompCode,
          workersCompDescription,
        })
        return NextResponse.json(result, { status: 201 })
      }

      case 'terminate': {
        const { enrollmentId, reason } = body
        if (!enrollmentId || !reason) {
          return NextResponse.json({ error: 'enrollmentId and reason are required' }, { status: 400 })
        }
        const result = await terminateCoEmployment(orgId, enrollmentId, reason)
        return NextResponse.json(result)
      }

      case 'sync': {
        const { configId, syncType } = body
        if (!configId) {
          return NextResponse.json({ error: 'configId is required' }, { status: 400 })
        }
        const result = await syncPeoData(orgId, configId, syncType || 'incremental')
        return NextResponse.json(result)
      }

      case 'manage-services': {
        const { configId, serviceAction, services } = body
        if (!configId || !serviceAction) {
          return NextResponse.json({ error: 'configId and serviceAction are required' }, { status: 400 })
        }
        const result = await managePeoServices(orgId, configId, serviceAction, services)
        return NextResponse.json(result)
      }

      case 'add-wc-code': {
        const { configId, classCode, description, state, rate, effectiveDate, expirationDate } = body
        if (!configId || !classCode || !description || !state || rate === undefined) {
          return NextResponse.json(
            { error: 'configId, classCode, description, state, and rate are required' },
            { status: 400 }
          )
        }
        const result = await addWorkersCompCode(orgId, configId, {
          classCode,
          description,
          state,
          rate,
          effectiveDate,
          expirationDate,
        })
        return NextResponse.json(result, { status: 201 })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[POST /api/peo] Error:', error)
    const message = error instanceof Error ? error.message : 'PEO operation failed'
    const status = error instanceof Error && 'code' in error ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

// PUT /api/peo - Update PEO configuration or enrollment
export async function PUT(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'update-config': {
        const { configId, ...updates } = body
        if (!configId) {
          return NextResponse.json({ error: 'configId is required' }, { status: 400 })
        }

        const { db } = await import('@/lib/db')
        const { schema } = await import('@/lib/db')
        const { eq, and } = await import('drizzle-orm')

        const allowedFields = [
          'peoProviderName', 'serviceType', 'contractStartDate', 'contractEndDate',
          'fein', 'stateRegistrations', 'services', 'adminFeeStructure',
          'workersCompPolicy', 'payrollSchedule', 'primaryContactName',
          'primaryContactEmail', 'primaryContactPhone', 'notes', 'status',
        ]

        const updateData: Record<string, unknown> = { updatedAt: new Date() }
        for (const field of allowedFields) {
          if (updates[field] !== undefined) {
            updateData[field] = updates[field]
          }
        }

        const result = await db.update(schema.peoConfigurations)
          .set(updateData)
          .where(and(
            eq(schema.peoConfigurations.id, configId),
            eq(schema.peoConfigurations.orgId, orgId)
          ))
          .returning()

        if (!result.length) {
          return NextResponse.json({ error: 'PEO configuration not found' }, { status: 404 })
        }

        return NextResponse.json({ configuration: result[0] })
      }

      case 'update-enrollment': {
        const { enrollmentId, workState, workCountry, workersCompCode, workersCompDescription } = body
        if (!enrollmentId) {
          return NextResponse.json({ error: 'enrollmentId is required' }, { status: 400 })
        }

        const { db } = await import('@/lib/db')
        const { schema } = await import('@/lib/db')
        const { eq, and } = await import('drizzle-orm')

        const updateData: Record<string, unknown> = { updatedAt: new Date() }
        if (workState !== undefined) updateData.workState = workState
        if (workCountry !== undefined) updateData.workCountry = workCountry
        if (workersCompCode !== undefined) updateData.workersCompCode = workersCompCode
        if (workersCompDescription !== undefined) updateData.workersCompDescription = workersCompDescription

        const result = await db.update(schema.peoEmployeeEnrollments)
          .set(updateData)
          .where(and(
            eq(schema.peoEmployeeEnrollments.id, enrollmentId),
            eq(schema.peoEmployeeEnrollments.orgId, orgId)
          ))
          .returning()

        if (!result.length) {
          return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
        }

        return NextResponse.json({ enrollment: result[0] })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[PUT /api/peo] Error:', error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}

// DELETE /api/peo - Delete a pending PEO configuration
export async function DELETE(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const configId = url.searchParams.get('configId')
    if (!configId) {
      return NextResponse.json({ error: 'configId is required' }, { status: 400 })
    }

    const { db } = await import('@/lib/db')
    const { schema } = await import('@/lib/db')
    const { eq, and } = await import('drizzle-orm')

    const configs = await db.select()
      .from(schema.peoConfigurations)
      .where(and(
        eq(schema.peoConfigurations.id, configId),
        eq(schema.peoConfigurations.orgId, orgId)
      ))

    if (!configs.length) {
      return NextResponse.json({ error: 'PEO configuration not found' }, { status: 404 })
    }

    if (configs[0].status === 'active') {
      return NextResponse.json(
        { error: 'Cannot delete an active PEO configuration. Deactivate it first.' },
        { status: 400 }
      )
    }

    // Check for active enrollments
    const activeEnrollments = await db.select()
      .from(schema.peoEmployeeEnrollments)
      .where(and(
        eq(schema.peoEmployeeEnrollments.peoConfigId, configId),
        eq(schema.peoEmployeeEnrollments.status, 'active')
      ))

    if (activeEnrollments.length > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${activeEnrollments.length} active enrollments exist. Terminate all enrollments first.` },
        { status: 400 }
      )
    }

    await db.delete(schema.peoConfigurations).where(eq(schema.peoConfigurations.id, configId))
    return NextResponse.json({ deleted: true, configId })
  } catch (error) {
    console.error('[DELETE /api/peo] Error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
