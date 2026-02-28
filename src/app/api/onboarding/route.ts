import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { hashPassword, createSession, setSessionCookie } from '@/lib/auth'
import { parseEmployeeCSV, generateCSVTemplate } from '@/lib/onboarding/csv-import'
import { sendInvitationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    // ─── Import Employees via CSV ─────────────────────────────────
    if (action === 'import-employees') {
      const orgId = request.headers.get('x-org-id')
      if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

      const { csvContent } = body
      if (!csvContent) return NextResponse.json({ error: 'csvContent is required' }, { status: 400 })

      const parseResult = parseEmployeeCSV(csvContent)

      if (parseResult.validRows === 0) {
        return NextResponse.json({
          success: false,
          imported: 0,
          errors: parseResult.errors,
          totalRows: parseResult.totalRows,
        }, { status: 400 })
      }

      // Import valid employees
      let imported = 0
      const importErrors: Array<{ row: number; field: string; message: string }> = [...parseResult.errors]

      // Get or create departments
      const existingDepts = await db.select().from(schema.departments).where(eq(schema.departments.orgId, orgId))
      const deptMap = new Map(existingDepts.map(d => [d.name.toLowerCase(), d.id]))

      for (const row of parseResult.valid) {
        try {
          // Check if email already exists in this org
          const [existing] = await db.select({ id: schema.employees.id })
            .from(schema.employees)
            .where(eq(schema.employees.email, row.email))
          
          if (existing) {
            importErrors.push({ row: imported + 1, field: 'email', message: `Employee ${row.email} already exists` })
            continue
          }

          // Create department if needed
          let departmentId: string | null = null
          if (row.department) {
            const deptKey = row.department.toLowerCase()
            if (deptMap.has(deptKey)) {
              departmentId = deptMap.get(deptKey)!
            } else {
              const [newDept] = await db.insert(schema.departments).values({
                orgId,
                name: row.department,
              }).returning()
              departmentId = newDept.id
              deptMap.set(deptKey, newDept.id)
            }
          }

          // Generate invitation token
          const invitationToken = crypto.randomUUID()

          // Create employee
          await db.insert(schema.employees).values({
            orgId,
            fullName: row.fullName,
            email: row.email,
            jobTitle: row.jobTitle || null,
            departmentId,
            country: row.country || null,
            phone: row.phone || null,
            hireDate: row.hireDate || null,
            role: (row.role as any) || 'employee',
            isActive: true,
            invitationToken,
            invitationExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          })

          // Send invitation email (non-blocking)
          const [org] = await db.select({ name: schema.organizations.name })
            .from(schema.organizations)
            .where(eq(schema.organizations.id, orgId))
          
          sendInvitationEmail(row.email, org?.name || 'Your Company', invitationToken).catch(err =>
            console.error(`[Onboarding] Invitation email failed for ${row.email}:`, err)
          )

          imported++
        } catch (err) {
          importErrors.push({
            row: imported + 1,
            field: 'system',
            message: err instanceof Error ? err.message : String(err),
          })
        }
      }

      return NextResponse.json({
        success: true,
        imported,
        failed: parseResult.validRows - imported,
        errors: importErrors,
        totalRows: parseResult.totalRows,
      })
    }

    // ─── Configure Modules ────────────────────────────────────────
    if (action === 'configure-modules') {
      const orgId = request.headers.get('x-org-id')
      if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

      const { modules } = body  // string[] of module IDs to enable
      if (!Array.isArray(modules)) {
        return NextResponse.json({ error: 'modules must be an array' }, { status: 400 })
      }

      const validModules = ['payroll', 'expenses', 'learning', 'performance', 'recruiting', 'time-attendance', 'benefits', 'engagement', 'projects', 'strategy', 'it-assets', 'finance']
      const filtered = modules.filter((m: string) => validModules.includes(m))

      await db.update(schema.organizations)
        .set({
          enabledModules: filtered,
          onboardingCompleted: true,
          updatedAt: new Date(),
        })
        .where(eq(schema.organizations.id, orgId))

      return NextResponse.json({ success: true, enabledModules: filtered })
    }

    // ─── Complete Onboarding ──────────────────────────────────────
    if (action === 'complete') {
      const orgId = request.headers.get('x-org-id')
      if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

      await db.update(schema.organizations)
        .set({ onboardingCompleted: true, updatedAt: new Date() })
        .where(eq(schema.organizations.id, orgId))

      return NextResponse.json({ success: true })
    }

    // ─── Get CSV Template ─────────────────────────────────────────
    if (action === 'csv-template') {
      const template = generateCSVTemplate()
      return new NextResponse(template, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="tempo-employee-import-template.csv"',
        },
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('[Onboarding] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
