import { db, schema } from '@/lib/db'
import { eq, and, between, sql, desc, count, sum, avg } from 'drizzle-orm'
import {
  calculateStatutoryDeductions,
  type StatutoryResult,
} from '@/lib/payroll/statutory-deductions'

// ─── Report Types ────────────────────────────────────────────────────

export interface PayrollSummaryReport {
  period: string
  orgId: string
  runCount: number
  totalEmployees: number
  totalGrossPay: number
  totalNetPay: number
  totalTax: number
  totalDeductions: number
  averageGrossPay: number
  averageNetPay: number
  currency: string
  byStatus: Record<string, number>
}

export interface DepartmentPayrollReport {
  departmentId: string
  departmentName: string
  employeeCount: number
  totalGross: number
  totalNet: number
  totalTax: number
  averageSalary: number
  highestSalary: number
  lowestSalary: number
}

export interface TaxFilingReport {
  period: string
  country: string
  currency: string
  totalGross: number
  totalFederalTax: number
  totalStateTax: number
  totalSocialSecurity: number
  totalMedicare: number
  totalPension: number
  additionalTaxes: Record<string, number>
  employeeCount: number
  entries: Array<{
    employeeId: string
    employeeName: string
    grossPay: number
    federalTax: number
    stateTax: number
    socialSecurity: number
    medicare: number
    pension: number
    netPay: number
  }>
}

export interface EmployeeYearEndSummary {
  employeeId: string
  employeeName: string
  employeeEmail: string
  country: string
  year: number
  totalGross: number
  totalFederalTax: number
  totalStateTax: number
  totalSocialSecurity: number
  totalMedicare: number
  totalPension: number
  totalDeductions: number
  totalNetPay: number
  payPeriods: number
  monthlyBreakdown: Array<{
    period: string
    grossPay: number
    totalTax: number
    netPay: number
  }>
}

// ─── Tax Certificate Types ──────────────────────────────────────────

export interface TaxCertificateData {
  country: string
  year: number
  employeeId: string
  employeeName: string
  employeeEmail: string
  certificateType: string
  data: NigeriaTaxCertificate | KenyaP9AForm | GhanaAnnualPAYE | SouthAfricaIRP5 | GenericTaxCertificate
}

export interface NigeriaTaxCertificate {
  type: 'NG_ANNUAL_TAX_DEDUCTION_CARD'
  employerTIN: string
  employeeTIN: string
  employeeName: string
  designation: string
  totalEmoluments: number
  grossPay: number
  pensionContributions: number
  nhfContributions: number
  nhisContributions: number
  consolidatedRelief: number
  taxableIncome: number
  taxDeducted: number
  currency: string
  monthlyBreakdown: Array<{ month: string; grossPay: number; tax: number; pension: number }>
}

export interface KenyaP9AForm {
  type: 'KE_P9A'
  employeePIN: string
  employeeName: string
  employerPIN: string
  year: number
  grossPayPerMonth: Array<{ month: string; amount: number }>
  payePerMonth: Array<{ month: string; amount: number }>
  nhifPerMonth: Array<{ month: string; amount: number }>
  nssfPerMonth: Array<{ month: string; amount: number }>
  totalGrossPay: number
  totalPAYE: number
  totalNHIF: number
  totalNSSF: number
  currency: string
}

export interface GhanaAnnualPAYE {
  type: 'GH_ANNUAL_PAYE_RETURN'
  ssnitNumber: string
  employeeName: string
  employerTIN: string
  basicSalary: number
  totalEmoluments: number
  ssnitContributions: number
  tier2Contributions: number
  taxDeducted: number
  currency: string
  monthlyBreakdown: Array<{ month: string; basicSalary: number; ssnit: number; tax: number }>
}

export interface SouthAfricaIRP5 {
  type: 'ZA_IRP5'
  taxReferenceNumber: string
  employeeName: string
  employeeIDNumber: string
  employerPAYERef: string
  grossIncome: number
  taxableIncome: number
  paye: number
  uif: number
  sdl: number
  retirementFundContributions: number
  currency: string
  monthlyBreakdown: Array<{ month: string; grossIncome: number; paye: number; uif: number }>
}

export interface GenericTaxCertificate {
  type: 'GENERIC'
  employeeName: string
  country: string
  year: number
  totalGrossPay: number
  totalTaxDeducted: number
  totalStatutoryDeductions: number
  totalNetPay: number
  currency: string
  monthlyBreakdown: Array<{ month: string; grossPay: number; tax: number; deductions: number; netPay: number }>
}

export interface PayrollJournalEntry {
  date: string
  description: string
  entries: Array<{
    accountName: string
    accountCode: string
    department?: string
    debit: number
    credit: number
  }>
  totals: { totalDebits: number; totalCredits: number }
}

// ─── Payroll Summary Report ──────────────────────────────────────────

export async function getPayrollSummary(
  orgId: string,
  period?: string,  // e.g., '2026-01' for a specific month, or '2026' for full year
): Promise<PayrollSummaryReport> {
  let runs
  if (period) {
    // Filter by period prefix (supports both '2026-01' and '2026')
    runs = await db.select()
      .from(schema.payrollRuns)
      .where(and(
        eq(schema.payrollRuns.orgId, orgId),
        sql`${schema.payrollRuns.period} LIKE ${period + '%'}`
      ))
  } else {
    runs = await db.select()
      .from(schema.payrollRuns)
      .where(eq(schema.payrollRuns.orgId, orgId))
  }

  // Count by status
  const byStatus: Record<string, number> = {}
  for (const run of runs) {
    byStatus[run.status] = (byStatus[run.status] || 0) + 1
  }

  // Get all entries for these runs to compute detailed totals
  const runIds = runs.map(r => r.id)
  let allEntries: Array<typeof schema.employeePayrollEntries.$inferSelect> = []
  
  if (runIds.length > 0) {
    // Fetch entries for all runs
    for (const runId of runIds) {
      const entries = await db.select()
        .from(schema.employeePayrollEntries)
        .where(eq(schema.employeePayrollEntries.payrollRunId, runId))
      allEntries.push(...entries)
    }
  }

  const totalGross = allEntries.reduce((s, e) => s + Number(e.grossPay || 0), 0)
  const totalNet = allEntries.reduce((s, e) => s + Number(e.netPay || 0), 0)
  const totalTax = allEntries.reduce((s, e) => s + Number(e.federalTax || 0) + Number(e.stateTax || 0), 0)
  const totalDeductions = allEntries.reduce((s, e) => s + Number(e.totalDeductions || 0), 0)
  const uniqueEmployees = new Set(allEntries.map(e => e.employeeId)).size

  return {
    period: period || 'all',
    orgId,
    runCount: runs.length,
    totalEmployees: uniqueEmployees,
    totalGrossPay: totalGross,
    totalNetPay: totalNet,
    totalTax: totalTax,
    totalDeductions: totalDeductions,
    averageGrossPay: uniqueEmployees > 0 ? Math.round(totalGross / uniqueEmployees) : 0,
    averageNetPay: uniqueEmployees > 0 ? Math.round(totalNet / uniqueEmployees) : 0,
    currency: runs[0]?.currency || 'USD',
    byStatus,
  }
}

// ─── Department Breakdown Report ─────────────────────────────────────

export async function getDepartmentPayrollReport(
  orgId: string,
  payrollRunId: string,
): Promise<DepartmentPayrollReport[]> {
  // Get all entries for this run
  const entries = await db.select()
    .from(schema.employeePayrollEntries)
    .where(eq(schema.employeePayrollEntries.payrollRunId, payrollRunId))

  // Get employee department info
  const employeeIds = [...new Set(entries.map(e => e.employeeId))]
  const employees = await Promise.all(
    employeeIds.map(id =>
      db.select({ id: schema.employees.id, departmentId: schema.employees.departmentId })
        .from(schema.employees)
        .where(eq(schema.employees.id, id))
        .then(r => r[0])
    )
  )

  // Get departments
  const departments = await db.select()
    .from(schema.departments)
    .where(eq(schema.departments.orgId, orgId))
  const deptMap = new Map(departments.map(d => [d.id, d.name]))

  // Group entries by department
  const empDeptMap = new Map(employees.filter(Boolean).map(e => [e!.id, e!.departmentId]))
  const deptGroups = new Map<string, typeof entries>()

  for (const entry of entries) {
    const deptId = empDeptMap.get(entry.employeeId) || 'unassigned'
    if (!deptGroups.has(deptId)) deptGroups.set(deptId, [])
    deptGroups.get(deptId)!.push(entry)
  }

  return Array.from(deptGroups.entries()).map(([deptId, deptEntries]) => {
    const grossPays = deptEntries.map(e => Number(e.grossPay || 0))
    const totalGross = grossPays.reduce((a, b) => a + b, 0)
    const totalNet = deptEntries.reduce((s, e) => s + Number(e.netPay || 0), 0)
    const totalTax = deptEntries.reduce((s, e) => s + Number(e.federalTax || 0) + Number(e.stateTax || 0), 0)

    return {
      departmentId: deptId,
      departmentName: deptMap.get(deptId) || 'Unassigned',
      employeeCount: deptEntries.length,
      totalGross,
      totalNet,
      totalTax,
      averageSalary: Math.round(totalGross / deptEntries.length),
      highestSalary: Math.max(...grossPays),
      lowestSalary: Math.min(...grossPays),
    }
  }).sort((a, b) => b.totalGross - a.totalGross)
}

// ─── Tax Filing Report ───────────────────────────────────────────────

export async function getTaxFilingReport(
  orgId: string,
  period: string,
  country?: string,
): Promise<TaxFilingReport[]> {
  // Get all runs for the period
  const runs = await db.select()
    .from(schema.payrollRuns)
    .where(and(
      eq(schema.payrollRuns.orgId, orgId),
      sql`${schema.payrollRuns.period} LIKE ${period + '%'}`
    ))

  // Get all entries
  let allEntries: Array<typeof schema.employeePayrollEntries.$inferSelect> = []
  for (const run of runs) {
    const entries = await db.select()
      .from(schema.employeePayrollEntries)
      .where(eq(schema.employeePayrollEntries.payrollRunId, run.id))
    allEntries.push(...entries)
  }

  // Filter by country if specified
  if (country) {
    allEntries = allEntries.filter(e => e.country === country)
  }

  // Group by country
  const countryGroups = new Map<string, typeof allEntries>()
  for (const entry of allEntries) {
    const c = entry.country || 'unknown'
    if (!countryGroups.has(c)) countryGroups.set(c, [])
    countryGroups.get(c)!.push(entry)
  }

  // Get employee names
  const employeeIds = [...new Set(allEntries.map(e => e.employeeId))]
  const employees = await Promise.all(
    employeeIds.map(id =>
      db.select({ id: schema.employees.id, fullName: schema.employees.fullName })
        .from(schema.employees)
        .where(eq(schema.employees.id, id))
        .then(r => r[0])
    )
  )
  const nameMap = new Map(employees.filter(Boolean).map(e => [e!.id, e!.fullName]))

  return Array.from(countryGroups.entries()).map(([c, entries]) => {
    // Aggregate additional taxes
    const additionalTaxes: Record<string, number> = {}
    for (const entry of entries) {
      const addl = entry.additionalTaxes as Record<string, number> | null
      if (addl) {
        for (const [key, value] of Object.entries(addl)) {
          additionalTaxes[key] = (additionalTaxes[key] || 0) + Number(value || 0)
        }
      }
    }

    return {
      period,
      country: c,
      currency: entries[0]?.currency || 'USD',
      totalGross: entries.reduce((s, e) => s + Number(e.grossPay || 0), 0),
      totalFederalTax: entries.reduce((s, e) => s + Number(e.federalTax || 0), 0),
      totalStateTax: entries.reduce((s, e) => s + Number(e.stateTax || 0), 0),
      totalSocialSecurity: entries.reduce((s, e) => s + Number(e.socialSecurity || 0), 0),
      totalMedicare: entries.reduce((s, e) => s + Number(e.medicare || 0), 0),
      totalPension: entries.reduce((s, e) => s + Number(e.pension || 0), 0),
      additionalTaxes,
      employeeCount: new Set(entries.map(e => e.employeeId)).size,
      entries: entries.map(e => ({
        employeeId: e.employeeId,
        employeeName: nameMap.get(e.employeeId) || 'Unknown',
        grossPay: Number(e.grossPay || 0),
        federalTax: Number(e.federalTax || 0),
        stateTax: Number(e.stateTax || 0),
        socialSecurity: Number(e.socialSecurity || 0),
        medicare: Number(e.medicare || 0),
        pension: Number(e.pension || 0),
        netPay: Number(e.netPay || 0),
      })),
    }
  })
}

// ─── Year-End Employee Summary (Tax Certificate Data) ────────────────

export async function getEmployeeYearEndSummary(
  orgId: string,
  employeeId: string,
  year: number,
): Promise<EmployeeYearEndSummary | null> {
  // Get all entries for this employee in the year
  const entries = await db.select()
    .from(schema.employeePayrollEntries)
    .where(and(
      eq(schema.employeePayrollEntries.orgId, orgId),
      eq(schema.employeePayrollEntries.employeeId, employeeId),
    ))

  // Filter by year (from associated payroll run periods)
  const runIds = [...new Set(entries.map(e => e.payrollRunId))]
  const runs = await Promise.all(
    runIds.map(id =>
      db.select({ id: schema.payrollRuns.id, period: schema.payrollRuns.period })
        .from(schema.payrollRuns)
        .where(eq(schema.payrollRuns.id, id))
        .then(r => r[0])
    )
  )
  
  const yearRuns = new Set(
    runs.filter(r => r && r.period.startsWith(year.toString())).map(r => r!.id)
  )
  const yearEntries = entries.filter(e => yearRuns.has(e.payrollRunId))

  if (yearEntries.length === 0) return null

  // Get employee info
  const [employee] = await db.select()
    .from(schema.employees)
    .where(eq(schema.employees.id, employeeId))
  if (!employee) return null

  // Build run period map
  const periodMap = new Map(runs.filter(Boolean).map(r => [r!.id, r!.period]))

  return {
    employeeId,
    employeeName: employee.fullName,
    employeeEmail: employee.email,
    country: employee.country || 'unknown',
    year,
    totalGross: yearEntries.reduce((s, e) => s + Number(e.grossPay || 0), 0),
    totalFederalTax: yearEntries.reduce((s, e) => s + Number(e.federalTax || 0), 0),
    totalStateTax: yearEntries.reduce((s, e) => s + Number(e.stateTax || 0), 0),
    totalSocialSecurity: yearEntries.reduce((s, e) => s + Number(e.socialSecurity || 0), 0),
    totalMedicare: yearEntries.reduce((s, e) => s + Number(e.medicare || 0), 0),
    totalPension: yearEntries.reduce((s, e) => s + Number(e.pension || 0), 0),
    totalDeductions: yearEntries.reduce((s, e) => s + Number(e.totalDeductions || 0), 0),
    totalNetPay: yearEntries.reduce((s, e) => s + Number(e.netPay || 0), 0),
    payPeriods: yearEntries.length,
    monthlyBreakdown: yearEntries.map(e => ({
      period: periodMap.get(e.payrollRunId) || 'unknown',
      grossPay: Number(e.grossPay || 0),
      totalTax: Number(e.federalTax || 0) + Number(e.stateTax || 0) + Number(e.socialSecurity || 0) + Number(e.medicare || 0) + Number(e.pension || 0),
      netPay: Number(e.netPay || 0),
    })).sort((a, b) => a.period.localeCompare(b.period)),
  }
}

// ─── Country-Specific Tax Certificate Generation ────────────────────

export async function generateTaxCertificateData(
  orgId: string,
  employeeId: string,
  year: number,
  country: string,
): Promise<TaxCertificateData | null> {
  const summary = await getEmployeeYearEndSummary(orgId, employeeId, year)
  if (!summary) return null

  const [employee] = await db.select()
    .from(schema.employees)
    .where(eq(schema.employees.id, employeeId))
  if (!employee) return null

  const [org] = await db.select()
    .from(schema.organizations)
    .where(eq(schema.organizations.id, orgId))

  // Get all payroll entries for this employee in the year
  const entries = await db.select()
    .from(schema.employeePayrollEntries)
    .where(and(
      eq(schema.employeePayrollEntries.orgId, orgId),
      eq(schema.employeePayrollEntries.employeeId, employeeId),
    ))

  const runIds = [...new Set(entries.map(e => e.payrollRunId))]
  const runs = await Promise.all(
    runIds.map(id =>
      db.select({ id: schema.payrollRuns.id, period: schema.payrollRuns.period })
        .from(schema.payrollRuns)
        .where(eq(schema.payrollRuns.id, id))
        .then(r => r[0])
    )
  )
  const yearRuns = new Set(runs.filter(r => r && r.period.startsWith(year.toString())).map(r => r!.id))
  const periodMap = new Map(runs.filter(Boolean).map(r => [r!.id, r!.period]))
  const yearEntries = entries
    .filter(e => yearRuns.has(e.payrollRunId))
    .sort((a, b) => (periodMap.get(a.payrollRunId) || '').localeCompare(periodMap.get(b.payrollRunId) || ''))

  const statutoryResult = await calculateStatutoryDeductions(country, summary.totalGross, { orgId })
  const normalizedCountry = country.toUpperCase().trim()

  switch (normalizedCountry) {
    case 'NG': {
      const pensionContribs = statutoryResult.deductions.filter(d => d.type === 'pension').reduce((s, d) => s + d.employeeAmount, 0)
      const nhfContribs = statutoryResult.deductions.filter(d => d.type === 'housing').reduce((s, d) => s + d.employeeAmount, 0)
      const nhisContribs = statutoryResult.deductions.filter(d => d.type === 'health').reduce((s, d) => s + d.employeeAmount, 0)
      const consolidatedRelief = Math.round((summary.totalGross * 0.2 + Math.max(200000, summary.totalGross * 0.01)) * 100) / 100
      const taxableIncome = Math.max(0, summary.totalGross - pensionContribs - nhfContribs - nhisContribs - consolidatedRelief)

      return {
        country: 'NG', year, employeeId,
        employeeName: employee.fullName, employeeEmail: employee.email,
        certificateType: 'Annual Tax Deduction Card',
        data: {
          type: 'NG_ANNUAL_TAX_DEDUCTION_CARD',
          employerTIN: org?.id?.substring(0, 10) || 'N/A',
          employeeTIN: employee.id.substring(0, 10),
          employeeName: employee.fullName,
          designation: employee.jobTitle || 'Employee',
          totalEmoluments: summary.totalGross, grossPay: summary.totalGross,
          pensionContributions: pensionContribs, nhfContributions: nhfContribs,
          nhisContributions: nhisContribs, consolidatedRelief, taxableIncome,
          taxDeducted: summary.totalFederalTax + summary.totalStateTax,
          currency: 'NGN',
          monthlyBreakdown: yearEntries.map(e => ({
            month: periodMap.get(e.payrollRunId) || 'unknown',
            grossPay: Number(e.grossPay || 0),
            tax: Number(e.federalTax || 0) + Number(e.stateTax || 0),
            pension: Number(e.pension || 0),
          })),
        } as NigeriaTaxCertificate,
      }
    }

    case 'KE': {
      const nssfPerMonth = yearEntries.map(e => ({
        month: periodMap.get(e.payrollRunId) || 'unknown',
        amount: Math.round(Number(e.pension || 0) * 100) / 100,
      }))
      const nhifPerMonth = await Promise.all(yearEntries.map(async e => {
        const monthGross = Number(e.grossPay || 0)
        const result = await calculateStatutoryDeductions('KE', monthGross * 12, { orgId })
        return {
          month: periodMap.get(e.payrollRunId) || 'unknown',
          amount: Math.round(result.deductions.filter(d => d.type === 'health').reduce((s, d) => s + d.employeeAmount, 0) / 12 * 100) / 100,
        }
      }))

      return {
        country: 'KE', year, employeeId,
        employeeName: employee.fullName, employeeEmail: employee.email,
        certificateType: 'P9A Tax Deduction Card',
        data: {
          type: 'KE_P9A',
          employeePIN: employee.id.substring(0, 11),
          employeeName: employee.fullName,
          employerPIN: org?.id?.substring(0, 11) || 'N/A',
          year,
          grossPayPerMonth: yearEntries.map(e => ({
            month: periodMap.get(e.payrollRunId) || 'unknown', amount: Number(e.grossPay || 0),
          })),
          payePerMonth: yearEntries.map(e => ({
            month: periodMap.get(e.payrollRunId) || 'unknown',
            amount: Number(e.federalTax || 0) + Number(e.stateTax || 0),
          })),
          nhifPerMonth, nssfPerMonth,
          totalGrossPay: summary.totalGross,
          totalPAYE: summary.totalFederalTax + summary.totalStateTax,
          totalNHIF: nhifPerMonth.reduce((s, m) => s + m.amount, 0),
          totalNSSF: nssfPerMonth.reduce((s, m) => s + m.amount, 0),
          currency: 'KES',
        } as KenyaP9AForm,
      }
    }

    case 'GH': {
      const ssnitContribs = statutoryResult.deductions.filter(d => d.name.includes('SSNIT')).reduce((s, d) => s + d.employeeAmount, 0)
      const tier2Contribs = statutoryResult.deductions.filter(d => d.name.includes('Tier 2')).reduce((s, d) => s + d.employeeAmount, 0)

      return {
        country: 'GH', year, employeeId,
        employeeName: employee.fullName, employeeEmail: employee.email,
        certificateType: 'Annual PAYE Return',
        data: {
          type: 'GH_ANNUAL_PAYE_RETURN',
          ssnitNumber: employee.id.substring(0, 13),
          employeeName: employee.fullName,
          employerTIN: org?.id?.substring(0, 11) || 'N/A',
          basicSalary: summary.totalGross, totalEmoluments: summary.totalGross,
          ssnitContributions: ssnitContribs, tier2Contributions: tier2Contribs,
          taxDeducted: summary.totalFederalTax + summary.totalStateTax,
          currency: 'GHS',
          monthlyBreakdown: yearEntries.map(e => ({
            month: periodMap.get(e.payrollRunId) || 'unknown',
            basicSalary: Number(e.grossPay || 0),
            ssnit: Math.round((ssnitContribs / Math.max(yearEntries.length, 1)) * 100) / 100,
            tax: Number(e.federalTax || 0) + Number(e.stateTax || 0),
          })),
        } as GhanaAnnualPAYE,
      }
    }

    case 'ZA': {
      const uifContribs = statutoryResult.deductions.filter(d => d.name.includes('UIF')).reduce((s, d) => s + d.employeeAmount, 0)
      const sdlContribs = statutoryResult.deductions.filter(d => d.name.includes('SDL')).reduce((s, d) => s + d.employerAmount, 0)
      const retirementContribs = statutoryResult.deductions.filter(d => d.type === 'pension').reduce((s, d) => s + d.employeeAmount, 0)

      return {
        country: 'ZA', year, employeeId,
        employeeName: employee.fullName, employeeEmail: employee.email,
        certificateType: 'IRP5 Employee Tax Certificate',
        data: {
          type: 'ZA_IRP5',
          taxReferenceNumber: employee.id.substring(0, 10),
          employeeName: employee.fullName,
          employeeIDNumber: employee.id.substring(0, 13),
          employerPAYERef: org?.id?.substring(0, 10) || 'N/A',
          grossIncome: summary.totalGross,
          taxableIncome: summary.totalGross - retirementContribs,
          paye: summary.totalFederalTax + summary.totalStateTax,
          uif: uifContribs, sdl: sdlContribs,
          retirementFundContributions: retirementContribs,
          currency: 'ZAR',
          monthlyBreakdown: yearEntries.map(e => ({
            month: periodMap.get(e.payrollRunId) || 'unknown',
            grossIncome: Number(e.grossPay || 0),
            paye: Number(e.federalTax || 0) + Number(e.stateTax || 0),
            uif: Math.round((uifContribs / Math.max(yearEntries.length, 1)) * 100) / 100,
          })),
        } as SouthAfricaIRP5,
      }
    }

    default: {
      return {
        country: normalizedCountry, year, employeeId,
        employeeName: employee.fullName, employeeEmail: employee.email,
        certificateType: 'Annual Tax Certificate',
        data: {
          type: 'GENERIC',
          employeeName: employee.fullName,
          country: normalizedCountry, year,
          totalGrossPay: summary.totalGross,
          totalTaxDeducted: summary.totalFederalTax + summary.totalStateTax,
          totalStatutoryDeductions: statutoryResult.totalEmployeeDeductions,
          totalNetPay: summary.totalNetPay,
          currency: yearEntries[0]?.currency || 'USD',
          monthlyBreakdown: yearEntries.map(e => ({
            month: periodMap.get(e.payrollRunId) || 'unknown',
            grossPay: Number(e.grossPay || 0),
            tax: Number(e.federalTax || 0) + Number(e.stateTax || 0),
            deductions: Number(e.totalDeductions || 0),
            netPay: Number(e.netPay || 0),
          })),
        } as GenericTaxCertificate,
      }
    }
  }
}

// ─── Payroll Journal Entries (Accounting Integration) ────────────────

export async function generatePayrollJournalEntries(
  orgId: string,
  period: string,
): Promise<PayrollJournalEntry[]> {
  const runs = await db.select()
    .from(schema.payrollRuns)
    .where(and(
      eq(schema.payrollRuns.orgId, orgId),
      sql`${schema.payrollRuns.period} LIKE ${period + '%'}`
    ))

  if (runs.length === 0) return []

  let allEntries: Array<typeof schema.employeePayrollEntries.$inferSelect> = []
  for (const run of runs) {
    const entries = await db.select()
      .from(schema.employeePayrollEntries)
      .where(eq(schema.employeePayrollEntries.payrollRunId, run.id))
    allEntries.push(...entries)
  }
  if (allEntries.length === 0) return []

  const employeeIds = [...new Set(allEntries.map(e => e.employeeId))]
  const employees = await Promise.all(
    employeeIds.map(id =>
      db.select({ id: schema.employees.id, departmentId: schema.employees.departmentId, country: schema.employees.country })
        .from(schema.employees).where(eq(schema.employees.id, id)).then(r => r[0])
    )
  )
  const empMap = new Map(employees.filter(Boolean).map(e => [e!.id, e!]))

  const departments = await db.select().from(schema.departments).where(eq(schema.departments.orgId, orgId))
  const deptMap = new Map(departments.map(d => [d.id, d.name]))

  const journalEntries: PayrollJournalEntry[] = []

  for (const run of runs) {
    const runEntries = allEntries.filter(e => e.payrollRunId === run.id)
    if (runEntries.length === 0) continue
    const journalLines: PayrollJournalEntry['entries'] = []

    // Salary expense DEBIT per department
    const deptGrossMap = new Map<string, number>()
    for (const entry of runEntries) {
      const emp = empMap.get(entry.employeeId)
      const deptId = emp?.departmentId || 'unassigned'
      const deptName = deptMap.get(deptId) || 'Unassigned'
      const key = `${deptId}|${deptName}`
      deptGrossMap.set(key, (deptGrossMap.get(key) || 0) + Number(entry.grossPay || 0))
    }
    for (const [key, amount] of deptGrossMap) {
      const [deptId, deptName] = key.split('|')
      journalLines.push({ accountName: `Salary Expense - ${deptName}`, accountCode: `5100-${deptId.substring(0, 4)}`, department: deptName, debit: amount, credit: 0 })
    }

    // Employer statutory contributions DEBIT
    let totalEmployerContributions = 0
    for (const entry of runEntries) {
      const emp = empMap.get(entry.employeeId)
      const countryCode = emp?.country || 'US'
      const statutoryResult = await calculateStatutoryDeductions(countryCode, Number(entry.grossPay || 0) * 12, { orgId })
      totalEmployerContributions += Math.round((statutoryResult.totalEmployerContributions / 12) * 100) / 100
    }
    if (totalEmployerContributions > 0) {
      journalLines.push({ accountName: 'Employer Statutory Contributions Expense', accountCode: '5200', debit: Math.round(totalEmployerContributions * 100) / 100, credit: 0 })
    }

    // Tax liability CREDITS
    const totalFederalTax = runEntries.reduce((s, e) => s + Number(e.federalTax || 0), 0)
    const totalStateTax = runEntries.reduce((s, e) => s + Number(e.stateTax || 0), 0)
    const totalSS = runEntries.reduce((s, e) => s + Number(e.socialSecurity || 0), 0)
    const totalMedicare = runEntries.reduce((s, e) => s + Number(e.medicare || 0), 0)
    const totalPension = runEntries.reduce((s, e) => s + Number(e.pension || 0), 0)

    if (totalFederalTax > 0) journalLines.push({ accountName: 'Federal/Income Tax Payable', accountCode: '2100', debit: 0, credit: totalFederalTax })
    if (totalStateTax > 0) journalLines.push({ accountName: 'State/Provincial Tax Payable', accountCode: '2110', debit: 0, credit: totalStateTax })
    if (totalSS + totalMedicare > 0) journalLines.push({ accountName: 'Social Security & Medicare Payable', accountCode: '2120', debit: 0, credit: totalSS + totalMedicare })
    if (totalPension > 0) journalLines.push({ accountName: 'Pension Contributions Payable', accountCode: '2130', debit: 0, credit: totalPension })
    if (totalEmployerContributions > 0) journalLines.push({ accountName: 'Employer Statutory Contributions Payable', accountCode: '2140', debit: 0, credit: Math.round(totalEmployerContributions * 100) / 100 })

    const totalGarnishments = runEntries.reduce((s, e) => s + Number(e.garnishmentTotal || 0), 0)
    const totalBenefits = runEntries.reduce((s, e) => s + Number(e.benefitDeductions || 0), 0)
    if (totalGarnishments > 0) journalLines.push({ accountName: 'Garnishments Payable', accountCode: '2150', debit: 0, credit: totalGarnishments })
    if (totalBenefits > 0) journalLines.push({ accountName: 'Benefit Deductions Payable', accountCode: '2160', debit: 0, credit: totalBenefits })

    // Net pay liability CREDIT (bank)
    const totalNetPay = runEntries.reduce((s, e) => s + Number(e.netPay || 0), 0)
    journalLines.push({ accountName: 'Net Payroll Payable / Bank', accountCode: '1000', debit: 0, credit: totalNetPay })

    const totalDebits = journalLines.reduce((s, l) => s + l.debit, 0)
    const totalCredits = journalLines.reduce((s, l) => s + l.credit, 0)

    journalEntries.push({
      date: run.runDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
      description: `Payroll journal entry for period ${run.period} (Run ID: ${run.id})`,
      entries: journalLines,
      totals: { totalDebits: Math.round(totalDebits * 100) / 100, totalCredits: Math.round(totalCredits * 100) / 100 },
    })
  }

  return journalEntries
}
