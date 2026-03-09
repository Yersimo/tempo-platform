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
  submitPayrollForApproval,
  approvePayrollHR,
  approvePayrollFinance,
  rejectPayrollRun,
  markPayrollProcessing,
  markPayrollPaid,
  cancelPayrollRun,
  COUNTRY_CURRENCY_MAP,
  validatePayrollRun,
} from '@/lib/payroll-engine'
import { generatePaymentFile, type PaymentInstruction } from '@/lib/payroll/bank-payments'
import { getPayrollRunAuditTrail } from '@/lib/payroll/audit'
import { generateReconciliation } from '@/lib/payroll/reconciliation'
import { generateTaxCertificateData, getEmployeeYearEndSummary } from '@/lib/payroll/reports'
import { generateKenyaP9PDF, generateNigeriaH1PDF, generateGhanaPAYEPDF } from '@/lib/payroll/tax-form-pdf'
import { zipSync } from 'fflate'
import { getTaxConfigsByCountry, invalidateTaxConfigCache } from '@/lib/payroll/tax-config-cache'
import { db, schema } from '@/lib/db'
import { eq, and, sql } from 'drizzle-orm'
import { payrollPostBody, calculateTaxParams, convertCurrencyParams } from '@/lib/validations/payroll'
import { formatZodError } from '@/lib/validations/common'

// GET /api/payroll - Analytics, compliance, tax info, currency conversion, bank file export
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

      // Fix 5: Get distinct countries of active employees for the country selector
      case 'employee-countries': {
        const rows = await db.selectDistinct({ country: schema.employees.country })
          .from(schema.employees)
          .where(and(
            eq(schema.employees.orgId, orgId),
            eq(schema.employees.isActive, true),
          ))
        const countries = rows.map(r => r.country).filter(Boolean) as string[]
        return NextResponse.json({ countries })
      }

      // Fix 6: Get currency map
      case 'currency-map': {
        return NextResponse.json({ map: COUNTRY_CURRENCY_MAP })
      }

      // Bank file preview — check which employees will be included/excluded
      case 'bank-file-preview': {
        const payrollRunId = url.searchParams.get('payrollRunId')
        if (!payrollRunId) {
          return NextResponse.json({ error: 'payrollRunId is required' }, { status: 400 })
        }

        const entries = await db.select({
          employeeId: schema.employeePayrollEntries.employeeId,
          netPay: schema.employeePayrollEntries.netPay,
          fullName: schema.employees.fullName,
          bankName: schema.employees.bankName,
          bankCode: schema.employees.bankCode,
          bankAccountNumber: schema.employees.bankAccountNumber,
        })
          .from(schema.employeePayrollEntries)
          .innerJoin(schema.employees, eq(schema.employeePayrollEntries.employeeId, schema.employees.id))
          .where(eq(schema.employeePayrollEntries.payrollRunId, payrollRunId))

        const included = entries
          .filter(e => e.bankAccountNumber)
          .map(e => ({ name: e.fullName, amount: e.netPay }))
        const excluded = entries
          .filter(e => !e.bankAccountNumber)
          .map(e => {
            const reasons: string[] = []
            if (!e.bankAccountNumber) reasons.push('Missing bank account number')
            if (!e.bankCode) reasons.push('Missing bank code')
            if (!e.bankName) reasons.push('Missing bank name')
            return { name: e.fullName, reason: reasons.join(', ') || 'Missing bank details' }
          })

        return NextResponse.json({ included, excluded })
      }

      // Fix 8: Bank file export
      case 'bank-file': {
        const payrollRunId = url.searchParams.get('payrollRunId')
        const format = url.searchParams.get('format') // optional override
        if (!payrollRunId) {
          return NextResponse.json({ error: 'payrollRunId is required' }, { status: 400 })
        }

        // Get payroll run
        const [run] = await db.select().from(schema.payrollRuns)
          .where(and(eq(schema.payrollRuns.id, payrollRunId), eq(schema.payrollRuns.orgId, orgId)))
          .limit(1)
        if (!run) return NextResponse.json({ error: 'Payroll run not found' }, { status: 404 })
        if (!['approved', 'processing', 'paid'].includes(run.status)) {
          return NextResponse.json({ error: `Cannot export bank file for payroll in '${run.status}' status. Must be approved or later.` }, { status: 400 })
        }

        // Get entries joined with employee bank details
        const entries = await db.select({
          employeeId: schema.employeePayrollEntries.employeeId,
          netPay: schema.employeePayrollEntries.netPay,
          currency: schema.employeePayrollEntries.currency,
          country: schema.employeePayrollEntries.country,
          fullName: schema.employees.fullName,
          bankName: schema.employees.bankName,
          bankCode: schema.employees.bankCode,
          bankAccountNumber: schema.employees.bankAccountNumber,
          bankAccountName: schema.employees.bankAccountName,
        })
          .from(schema.employeePayrollEntries)
          .innerJoin(schema.employees, eq(schema.employeePayrollEntries.employeeId, schema.employees.id))
          .where(eq(schema.employeePayrollEntries.payrollRunId, payrollRunId))

        if (entries.length === 0) {
          return NextResponse.json({ error: 'No entries found for this payroll run' }, { status: 404 })
        }

        // Build payment instructions
        const instructions: PaymentInstruction[] = entries
          .filter(e => e.bankAccountNumber) // skip employees without bank details
          .map(e => ({
            employeeId: e.employeeId,
            employeeName: e.bankAccountName || e.fullName,
            bankName: e.bankName || '',
            bankCode: e.bankCode || '',
            accountNumber: e.bankAccountNumber || '',
            amount: (e.netPay || 0) / 100, // convert from cents
            currency: e.currency || run.currency,
            reference: `PAY-${run.period}-${e.employeeId.substring(0, 8)}`,
          }))

        const missingBank = entries.filter(e => !e.bankAccountNumber)
        const country = format || run.country || 'US'
        const batchRef = `PAY-${run.period}-${payrollRunId.substring(0, 8)}`

        // Look up org's default currency account for originator bank details
        const [defaultAccount] = await db.select().from(schema.currencyAccounts)
          .where(and(eq(schema.currencyAccounts.orgId, orgId), eq(schema.currencyAccounts.isDefault, true)))
          .limit(1)
        const originatorRouting = defaultAccount?.routingNumber || defaultAccount?.bankName || 'UNKNOWN'
        const originatorAccount = defaultAccount?.bankAccountNumber || 'UNKNOWN'
        const originatorName = defaultAccount?.accountName || 'Tempo Payroll'
        const originatorBankName = defaultAccount?.bankName || undefined

        const result = generatePaymentFile(country, instructions, originatorRouting, originatorAccount, batchRef, orgId, originatorName, originatorBankName)

        // Return as downloadable file
        const headers = new Headers()
        headers.set('Content-Type', result.mimeType)
        headers.set('Content-Disposition', `attachment; filename="${result.filename}"`)

        return new NextResponse(result.content, { status: 200, headers })
      }

      // Reconciliation — compare two paid payroll runs
      case 'reconciliation': {
        const previousRunId = url.searchParams.get('previousRunId')
        const currentRunId = url.searchParams.get('currentRunId')
        if (!previousRunId || !currentRunId) {
          return NextResponse.json({ error: 'previousRunId and currentRunId are required' }, { status: 400 })
        }
        const reconciliation = await generateReconciliation(orgId, previousRunId, currentRunId)
        return NextResponse.json(reconciliation)
      }

      // Audit trail for a payroll run — immutable timeline
      case 'audit-trail': {
        const payrollRunId = url.searchParams.get('payrollRunId')
        if (!payrollRunId) {
          return NextResponse.json({ error: 'payrollRunId is required' }, { status: 400 })
        }
        const trail = await getPayrollRunAuditTrail(orgId, payrollRunId)
        return NextResponse.json({ trail })
      }

      // Validate payroll run — pre-flight check for eligible/ineligible employees
      case 'validate-run': {
        const country = url.searchParams.get('country') || undefined
        const result = await validatePayrollRun(orgId, { country })
        return NextResponse.json(result)
      }

      // Fix 7: Employee payslips — get completed payroll runs an employee was part of
      case 'my-payslips': {
        const employeeId = url.searchParams.get('employeeId')
        if (!employeeId) {
          return NextResponse.json({ error: 'employeeId is required' }, { status: 400 })
        }
        const payslips = await db.select({
          entryId: schema.employeePayrollEntries.id,
          payrollRunId: schema.employeePayrollEntries.payrollRunId,
          netPay: schema.employeePayrollEntries.netPay,
          grossPay: schema.employeePayrollEntries.grossPay,
          totalDeductions: schema.employeePayrollEntries.totalDeductions,
          currency: schema.employeePayrollEntries.currency,
          period: schema.payrollRuns.period,
          status: schema.payrollRuns.status,
          runDate: schema.payrollRuns.runDate,
        })
          .from(schema.employeePayrollEntries)
          .innerJoin(schema.payrollRuns, eq(schema.employeePayrollEntries.payrollRunId, schema.payrollRuns.id))
          .where(and(
            eq(schema.employeePayrollEntries.employeeId, employeeId),
            eq(schema.payrollRuns.status, 'paid'),
          ))
          .orderBy(schema.payrollRuns.createdAt)
        return NextResponse.json({ payslips })
      }

      // Year-end tax form — single employee PDF
      case 'year-end-form': {
        const employeeId = url.searchParams.get('employeeId')
        const yearStr = url.searchParams.get('year')
        const country = url.searchParams.get('country')
        if (!employeeId || !yearStr || !country) {
          return NextResponse.json({ error: 'employeeId, year, and country are required' }, { status: 400 })
        }
        const year = parseInt(yearStr, 10)
        const certData = await generateTaxCertificateData(orgId, employeeId, year, country)
        if (!certData) {
          return NextResponse.json({ error: 'No payroll data found for this employee/year' }, { status: 404 })
        }

        const [employee] = await db.select().from(schema.employees).where(eq(schema.employees.id, employeeId)).limit(1)
        const [org] = await db.select().from(schema.organizations).where(eq(schema.organizations.id, orgId)).limit(1)
        if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

        const empInfo = {
          name: employee.fullName,
          email: employee.email,
          pin: employee.taxIdNumber || employee.id.substring(0, 11),
          tin: employee.taxIdNumber || employee.id.substring(0, 10),
          ssnit: employee.taxIdNumber || employee.id.substring(0, 13),
          jobTitle: employee.jobTitle || 'Employee',
        }
        const empInfo2 = { name: org?.name || 'Employer', pin: orgId.substring(0, 11), tin: orgId.substring(0, 10) }

        let pdfBytes: Uint8Array
        let filename: string
        const normalizedCountry = country.toUpperCase()

        if (normalizedCountry === 'KE') {
          pdfBytes = await generateKenyaP9PDF(certData.data as any, empInfo, empInfo2)
          filename = `P9A_${employee.fullName.replace(/\s+/g, '_')}_${year}.pdf`
        } else if (normalizedCountry === 'NG') {
          pdfBytes = await generateNigeriaH1PDF(certData.data as any, empInfo, empInfo2)
          filename = `FormH1_${employee.fullName.replace(/\s+/g, '_')}_${year}.pdf`
        } else if (normalizedCountry === 'GH') {
          pdfBytes = await generateGhanaPAYEPDF(certData.data as any, empInfo, empInfo2)
          filename = `PAYE_${employee.fullName.replace(/\s+/g, '_')}_${year}.pdf`
        } else {
          return NextResponse.json({ error: `Year-end form not supported for country: ${country}` }, { status: 400 })
        }

        const headers = new Headers()
        headers.set('Content-Type', 'application/pdf')
        headers.set('Content-Disposition', `attachment; filename="${filename}"`)
        return new NextResponse(Buffer.from(pdfBytes), { status: 200, headers })
      }

      // Year-end forms bulk — ZIP of all employee PDFs for a country/year
      case 'year-end-forms-bulk': {
        const yearStr = url.searchParams.get('year')
        const country = url.searchParams.get('country')
        if (!yearStr || !country) {
          return NextResponse.json({ error: 'year and country are required' }, { status: 400 })
        }
        const year = parseInt(yearStr, 10)
        const normalizedCountry = country.toUpperCase()

        // Get all employees for this country
        const employees = await db.select().from(schema.employees)
          .where(and(
            eq(schema.employees.orgId, orgId),
            eq(schema.employees.isActive, true),
          ))
        const countryEmployees = employees.filter(e => {
          const c = (e.country || '').toUpperCase().trim()
          return c === normalizedCountry || c === { KE: 'KENYA', NG: 'NIGERIA', GH: 'GHANA' }[normalizedCountry]
        })

        if (countryEmployees.length === 0) {
          return NextResponse.json({ error: `No employees found for country: ${country}` }, { status: 404 })
        }

        const [org] = await db.select().from(schema.organizations).where(eq(schema.organizations.id, orgId)).limit(1)
        const empInfo2 = { name: org?.name || 'Employer', pin: orgId.substring(0, 11), tin: orgId.substring(0, 10) }

        const zipFiles: Record<string, Uint8Array> = {}
        for (const emp of countryEmployees) {
          const certData = await generateTaxCertificateData(orgId, emp.id, year, normalizedCountry)
          if (!certData) continue

          const empInfo = {
            name: emp.fullName, email: emp.email,
            pin: emp.taxIdNumber || emp.id.substring(0, 11),
            tin: emp.taxIdNumber || emp.id.substring(0, 10),
            ssnit: emp.taxIdNumber || emp.id.substring(0, 13),
            jobTitle: emp.jobTitle || 'Employee',
          }

          let pdfBytes: Uint8Array
          let filename: string
          if (normalizedCountry === 'KE') {
            pdfBytes = await generateKenyaP9PDF(certData.data as any, empInfo, empInfo2)
            filename = `P9A_${emp.fullName.replace(/\s+/g, '_')}_${year}.pdf`
          } else if (normalizedCountry === 'NG') {
            pdfBytes = await generateNigeriaH1PDF(certData.data as any, empInfo, empInfo2)
            filename = `FormH1_${emp.fullName.replace(/\s+/g, '_')}_${year}.pdf`
          } else {
            pdfBytes = await generateGhanaPAYEPDF(certData.data as any, empInfo, empInfo2)
            filename = `PAYE_${emp.fullName.replace(/\s+/g, '_')}_${year}.pdf`
          }
          zipFiles[filename] = pdfBytes
        }

        if (Object.keys(zipFiles).length === 0) {
          return NextResponse.json({ error: 'No payroll data found for any employees in this year' }, { status: 404 })
        }

        const zipped = zipSync(zipFiles)
        const headers = new Headers()
        headers.set('Content-Type', 'application/zip')
        headers.set('Content-Disposition', `attachment; filename="tax_forms_${normalizedCountry}_${year}.zip"`)
        return new NextResponse(Buffer.from(zipped), { status: 200, headers })
      }

      // Year-end summary data — employee list with YTD totals for the UI
      case 'year-end-summary': {
        const yearStr = url.searchParams.get('year')
        const country = url.searchParams.get('country')
        if (!yearStr) {
          return NextResponse.json({ error: 'year is required' }, { status: 400 })
        }
        const year = parseInt(yearStr, 10)

        const employees = await db.select().from(schema.employees)
          .where(and(eq(schema.employees.orgId, orgId), eq(schema.employees.isActive, true)))

        const filtered = country
          ? employees.filter(e => {
              const c = (e.country || '').toUpperCase().trim()
              const nc = country.toUpperCase()
              return c === nc || c === { KE: 'KENYA', NG: 'NIGERIA', GH: 'GHANA', ZA: 'SOUTH AFRICA' }[nc]
            })
          : employees

        const summaries = await Promise.all(
          filtered.map(async (emp) => {
            const summary = await getEmployeeYearEndSummary(orgId, emp.id, year)
            if (!summary) return null
            return {
              employeeId: emp.id,
              employeeName: emp.fullName,
              country: emp.country,
              taxIdNumber: emp.taxIdNumber || null,
              totalGross: summary.totalGross,
              totalTax: summary.totalFederalTax + summary.totalStateTax,
              totalDeductions: summary.totalDeductions,
              totalNet: summary.totalNetPay,
              payPeriods: summary.payPeriods,
            }
          })
        )

        return NextResponse.json({ employees: summaries.filter(Boolean) })
      }

      // Tax configs — get all active configs grouped by country
      case 'tax-configs-grouped': {
        const grouped = await getTaxConfigsByCountry(orgId)
        return NextResponse.json({ configs: grouped })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[GET /api/payroll] Error:', error)
    return NextResponse.json({ error: 'Payroll query failed' }, { status: 500 })
  }
}

// POST /api/payroll - Process payroll, generate pay stubs, approve/reject/cancel runs, update status
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
          country: parsed.data.country,
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

      // Legacy approve — auto-routes based on current status
      case 'approve': {
        const result = await approvePayrollRun(orgId, parsed.data.payrollRunId, parsed.data.approverId, parsed.data.approverRole)
        return NextResponse.json(result)
      }

      // Fix 2: Submit for approval (draft → pending_hr)
      case 'submit': {
        const result = await submitPayrollForApproval(orgId, parsed.data.payrollRunId, parsed.data.submitterId)
        return NextResponse.json(result)
      }

      // Fix 2: HR approve (pending_hr → pending_finance)
      case 'approve-hr': {
        const result = await approvePayrollHR(orgId, parsed.data.payrollRunId, parsed.data.approverId, parsed.data.comment)
        return NextResponse.json(result)
      }

      // Fix 2: Finance approve (pending_finance → approved)
      case 'approve-finance': {
        const result = await approvePayrollFinance(orgId, parsed.data.payrollRunId, parsed.data.approverId, parsed.data.comment)
        return NextResponse.json(result)
      }

      // Fix 2: Reject (pending_hr/pending_finance → draft)
      case 'reject': {
        const result = await rejectPayrollRun(orgId, parsed.data.payrollRunId, parsed.data.rejectorId, parsed.data.rejectorRole, parsed.data.reason)
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

      case 'update-tax-config': {
        const d = parsed.data as any
        // Supersede old row (mark as superseded)
        if (d.configId) {
          await db.update(schema.taxConfigs)
            .set({ status: 'superseded' })
            .where(and(eq(schema.taxConfigs.id, d.configId), eq(schema.taxConfigs.orgId, orgId)))
        }
        // Insert new row
        const [newConfig] = await db.insert(schema.taxConfigs).values({
          orgId,
          country: d.country,
          taxType: d.taxType,
          rate: d.rate,
          description: d.description || null,
          employerContribution: d.employerContribution || 0,
          employeeContribution: d.employeeContribution || 0,
          effectiveDate: d.effectiveDate || new Date().toISOString().split('T')[0],
          status: 'active',
        }).returning()
        // Invalidate cache
        invalidateTaxConfigCache(orgId)
        return NextResponse.json(newConfig)
      }

      default:
        return NextResponse.json({ error: `Unknown action` }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[POST /api/payroll] Error:', error)
    return NextResponse.json({ error: error?.message || 'Payroll operation failed' }, { status: 500 })
  }
}
