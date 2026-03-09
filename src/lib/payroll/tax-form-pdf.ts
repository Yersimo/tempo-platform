/**
 * Year-End Statutory Tax Form PDF Generators
 *
 * Generates PDF tax forms for:
 * - Kenya P9A (Tax Deduction Card)
 * - Nigeria Form H1 (Annual Tax Deduction Certificate)
 * - Ghana Annual PAYE Summary
 *
 * Uses pdf-lib (same pattern as pay-stub-pdf.ts).
 */

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { KenyaP9AForm, NigeriaTaxCertificate, GhanaAnnualPAYE } from './reports'

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Format a number as currency with thousands separators */
function fmt(amount: number, currency: string): string {
  return `${currency} ${(amount / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/** Month name from period string like "2026-03" */
function monthName(period: string): string {
  const [, m] = period.split('-')
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return names[parseInt(m, 10) - 1] || period
}

const PAGE_W = 612  // US Letter width
const PAGE_H = 792  // US Letter height
const MARGIN = 40
const COL_W = PAGE_W - 2 * MARGIN

// Colors
const DARK = rgb(0.1, 0.1, 0.15)
const GRAY = rgb(0.4, 0.4, 0.45)
const LIGHT_GRAY = rgb(0.6, 0.6, 0.65)
const HEADER_BG = rgb(0.12, 0.16, 0.38)
const HEADER_FG = rgb(1, 1, 1)
const ROW_ALT = rgb(0.96, 0.97, 0.98)

// ---------------------------------------------------------------------------
// Kenya P9A
// ---------------------------------------------------------------------------

export async function generateKenyaP9PDF(
  data: KenyaP9AForm,
  employee: { name: string; email: string; pin: string; jobTitle: string },
  employer: { name: string; pin: string },
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)
  const fontNormal = await doc.embedFont(StandardFonts.Helvetica)
  const page = doc.addPage([PAGE_W, PAGE_H])

  let y = PAGE_H - MARGIN

  // Title
  page.drawRectangle({ x: MARGIN, y: y - 30, width: COL_W, height: 30, color: HEADER_BG })
  page.drawText('KENYA REVENUE AUTHORITY — TAX DEDUCTION CARD (P9A)', {
    x: MARGIN + 10, y: y - 22, font: fontBold, size: 11, color: HEADER_FG,
  })
  y -= 45

  // Year
  page.drawText(`Year of Income: ${data.year}`, { x: MARGIN, y, font: fontBold, size: 10, color: DARK })
  y -= 20

  // Employer / Employee Info
  const drawField = (label: string, value: string, x: number, yPos: number) => {
    page.drawText(label, { x, y: yPos, font: fontNormal, size: 8, color: GRAY })
    page.drawText(value, { x: x + 100, y: yPos, font: fontBold, size: 9, color: DARK })
  }
  drawField("Employer's Name:", employer.name, MARGIN, y)
  drawField("Employer's PIN:", employer.pin, MARGIN + 280, y)
  y -= 15
  drawField("Employee's Name:", employee.name, MARGIN, y)
  drawField("Employee's PIN:", employee.pin, MARGIN + 280, y)
  y -= 15
  drawField("Designation:", employee.jobTitle, MARGIN, y)
  y -= 25

  // Monthly table
  const cols = [
    { label: 'Month', w: 65, align: 'left' as const },
    { label: 'Gross Pay', w: 100, align: 'right' as const },
    { label: 'PAYE', w: 90, align: 'right' as const },
    { label: 'NHIF', w: 80, align: 'right' as const },
    { label: 'NSSF', w: 80, align: 'right' as const },
  ]
  // Header row
  let cx = MARGIN
  page.drawRectangle({ x: MARGIN, y: y - 14, width: COL_W, height: 16, color: HEADER_BG })
  for (const col of cols) {
    const tx = col.align === 'right' ? cx + col.w - 5 : cx + 5
    page.drawText(col.label, { x: tx, y: y - 10, font: fontBold, size: 8, color: HEADER_FG, ...(col.align === 'right' ? {} : {}) })
    cx += col.w
  }
  y -= 16

  // Data rows (up to 12 months)
  const allMonths = Array.from({ length: 12 }, (_, i) => {
    const monthStr = `${data.year}-${String(i + 1).padStart(2, '0')}`
    const gross = data.grossPayPerMonth.find(m => m.month === monthStr)?.amount || 0
    const paye = data.payePerMonth.find(m => m.month === monthStr)?.amount || 0
    const nhif = data.nhifPerMonth.find(m => m.month === monthStr)?.amount || 0
    const nssf = data.nssfPerMonth.find(m => m.month === monthStr)?.amount || 0
    return { month: monthStr, gross, paye, nhif, nssf }
  })

  for (let i = 0; i < allMonths.length; i++) {
    const row = allMonths[i]
    if (i % 2 === 0) {
      page.drawRectangle({ x: MARGIN, y: y - 12, width: COL_W, height: 14, color: ROW_ALT })
    }
    cx = MARGIN
    const vals = [monthName(row.month), fmt(row.gross, data.currency), fmt(row.paye, data.currency), fmt(row.nhif, data.currency), fmt(row.nssf, data.currency)]
    for (let j = 0; j < cols.length; j++) {
      const tx = cols[j].align === 'right' ? cx + cols[j].w - 5 : cx + 5
      page.drawText(vals[j], { x: tx, y: y - 9, font: fontNormal, size: 7.5, color: DARK })
      cx += cols[j].w
    }
    y -= 14
  }

  // Totals row
  y -= 2
  page.drawRectangle({ x: MARGIN, y: y - 14, width: COL_W, height: 16, color: rgb(0.9, 0.92, 0.95) })
  cx = MARGIN
  const totals = ['TOTALS', fmt(data.totalGrossPay, data.currency), fmt(data.totalPAYE, data.currency), fmt(data.totalNHIF, data.currency), fmt(data.totalNSSF, data.currency)]
  for (let j = 0; j < cols.length; j++) {
    const tx = cols[j].align === 'right' ? cx + cols[j].w - 5 : cx + 5
    page.drawText(totals[j], { x: tx, y: y - 10, font: fontBold, size: 8, color: DARK })
    cx += cols[j].w
  }
  y -= 30

  // Footer
  page.drawText(`Generated on ${new Date().toLocaleDateString()} — This document is computer-generated and does not require a signature.`, {
    x: MARGIN, y: y, font: fontNormal, size: 7, color: LIGHT_GRAY,
  })

  return doc.save()
}

// ---------------------------------------------------------------------------
// Nigeria Form H1
// ---------------------------------------------------------------------------

export async function generateNigeriaH1PDF(
  data: NigeriaTaxCertificate,
  employee: { name: string; email: string; tin: string; jobTitle: string },
  employer: { name: string; tin: string },
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)
  const fontNormal = await doc.embedFont(StandardFonts.Helvetica)
  const page = doc.addPage([PAGE_W, PAGE_H])

  let y = PAGE_H - MARGIN

  // Title
  page.drawRectangle({ x: MARGIN, y: y - 30, width: COL_W, height: 30, color: rgb(0.0, 0.35, 0.15) })
  page.drawText('FEDERAL INLAND REVENUE SERVICE — ANNUAL TAX DEDUCTION CARD (FORM H1)', {
    x: MARGIN + 10, y: y - 22, font: fontBold, size: 9.5, color: HEADER_FG,
  })
  y -= 45

  // Info section
  const drawField = (label: string, value: string, x: number, yPos: number) => {
    page.drawText(label, { x, y: yPos, font: fontNormal, size: 8, color: GRAY })
    page.drawText(value, { x: x + 110, y: yPos, font: fontBold, size: 9, color: DARK })
  }
  drawField("Employer's TIN:", employer.tin, MARGIN, y)
  drawField("Employer's Name:", employer.name, MARGIN + 260, y)
  y -= 15
  drawField("Employee's TIN:", employee.tin, MARGIN, y)
  drawField("Employee's Name:", employee.name, MARGIN + 260, y)
  y -= 15
  drawField("Designation:", employee.jobTitle, MARGIN, y)
  y -= 25

  // Monthly breakdown table
  const cols = [
    { label: 'Month', w: 65, align: 'left' as const },
    { label: 'Gross Pay', w: 100, align: 'right' as const },
    { label: 'PAYE Tax', w: 100, align: 'right' as const },
    { label: 'Pension', w: 100, align: 'right' as const },
  ]
  let cx = MARGIN
  page.drawRectangle({ x: MARGIN, y: y - 14, width: COL_W, height: 16, color: rgb(0.0, 0.35, 0.15) })
  for (const col of cols) {
    const tx = col.align === 'right' ? cx + col.w - 5 : cx + 5
    page.drawText(col.label, { x: tx, y: y - 10, font: fontBold, size: 8, color: HEADER_FG })
    cx += col.w
  }
  y -= 16

  for (let i = 0; i < data.monthlyBreakdown.length; i++) {
    const row = data.monthlyBreakdown[i]
    if (i % 2 === 0) {
      page.drawRectangle({ x: MARGIN, y: y - 12, width: COL_W, height: 14, color: ROW_ALT })
    }
    cx = MARGIN
    const vals = [monthName(row.month), fmt(row.grossPay, data.currency), fmt(row.tax, data.currency), fmt(row.pension, data.currency)]
    for (let j = 0; j < cols.length; j++) {
      const tx = cols[j].align === 'right' ? cx + cols[j].w - 5 : cx + 5
      page.drawText(vals[j], { x: tx, y: y - 9, font: fontNormal, size: 7.5, color: DARK })
      cx += cols[j].w
    }
    y -= 14
  }

  // Totals
  y -= 2
  page.drawRectangle({ x: MARGIN, y: y - 14, width: COL_W, height: 16, color: rgb(0.9, 0.92, 0.95) })
  cx = MARGIN
  const totals = ['TOTALS', fmt(data.grossPay, data.currency), fmt(data.taxDeducted, data.currency), fmt(data.pensionContributions, data.currency)]
  for (let j = 0; j < cols.length; j++) {
    const tx = cols[j].align === 'right' ? cx + cols[j].w - 5 : cx + 5
    page.drawText(totals[j], { x: tx, y: y - 10, font: fontBold, size: 8, color: DARK })
    cx += cols[j].w
  }
  y -= 30

  // Reliefs section
  page.drawText('RELIEFS AND ALLOWANCES', { x: MARGIN, y, font: fontBold, size: 9, color: DARK })
  y -= 15
  const reliefs = [
    ['Pension Contributions', fmt(data.pensionContributions, data.currency)],
    ['NHF Contributions', fmt(data.nhfContributions, data.currency)],
    ['NHIS Contributions', fmt(data.nhisContributions, data.currency)],
    ['Consolidated Relief Allowance', fmt(data.consolidatedRelief, data.currency)],
    ['Taxable Income', fmt(data.taxableIncome, data.currency)],
    ['Total Tax Deducted', fmt(data.taxDeducted, data.currency)],
  ]
  for (const [label, value] of reliefs) {
    page.drawText(label, { x: MARGIN + 10, y, font: fontNormal, size: 8, color: DARK })
    page.drawText(value, { x: MARGIN + 300, y, font: fontBold, size: 8, color: DARK })
    y -= 13
  }
  y -= 15

  // Footer
  page.drawText(`Generated on ${new Date().toLocaleDateString()} — This document is computer-generated and does not require a signature.`, {
    x: MARGIN, y, font: fontNormal, size: 7, color: LIGHT_GRAY,
  })

  return doc.save()
}

// ---------------------------------------------------------------------------
// Ghana Annual PAYE Summary
// ---------------------------------------------------------------------------

export async function generateGhanaPAYEPDF(
  data: GhanaAnnualPAYE,
  employee: { name: string; email: string; ssnit: string; jobTitle: string },
  employer: { name: string; tin: string },
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)
  const fontNormal = await doc.embedFont(StandardFonts.Helvetica)
  const page = doc.addPage([PAGE_W, PAGE_H])

  let y = PAGE_H - MARGIN

  // Title
  page.drawRectangle({ x: MARGIN, y: y - 30, width: COL_W, height: 30, color: rgb(0.7, 0.55, 0.0) })
  page.drawText('GHANA REVENUE AUTHORITY — ANNUAL PAYE RETURN SUMMARY', {
    x: MARGIN + 10, y: y - 22, font: fontBold, size: 10, color: rgb(0.1, 0.1, 0.1),
  })
  y -= 45

  // Info section
  const drawField = (label: string, value: string, x: number, yPos: number) => {
    page.drawText(label, { x, y: yPos, font: fontNormal, size: 8, color: GRAY })
    page.drawText(value, { x: x + 110, y: yPos, font: fontBold, size: 9, color: DARK })
  }
  drawField("Employer's TIN:", employer.tin, MARGIN, y)
  drawField("Employer's Name:", employer.name, MARGIN + 260, y)
  y -= 15
  drawField("Employee's Name:", employee.name, MARGIN, y)
  drawField("SSNIT Number:", employee.ssnit, MARGIN + 260, y)
  y -= 25

  // Monthly breakdown table
  const cols = [
    { label: 'Month', w: 65, align: 'left' as const },
    { label: 'Basic Salary', w: 110, align: 'right' as const },
    { label: 'SSNIT (Tier 1)', w: 100, align: 'right' as const },
    { label: 'PAYE Tax', w: 100, align: 'right' as const },
  ]
  let cx = MARGIN
  page.drawRectangle({ x: MARGIN, y: y - 14, width: COL_W, height: 16, color: rgb(0.7, 0.55, 0.0) })
  for (const col of cols) {
    const tx = col.align === 'right' ? cx + col.w - 5 : cx + 5
    page.drawText(col.label, { x: tx, y: y - 10, font: fontBold, size: 8, color: rgb(0.1, 0.1, 0.1) })
    cx += col.w
  }
  y -= 16

  for (let i = 0; i < data.monthlyBreakdown.length; i++) {
    const row = data.monthlyBreakdown[i]
    if (i % 2 === 0) {
      page.drawRectangle({ x: MARGIN, y: y - 12, width: COL_W, height: 14, color: ROW_ALT })
    }
    cx = MARGIN
    const vals = [monthName(row.month), fmt(row.basicSalary, data.currency), fmt(row.ssnit, data.currency), fmt(row.tax, data.currency)]
    for (let j = 0; j < cols.length; j++) {
      const tx = cols[j].align === 'right' ? cx + cols[j].w - 5 : cx + 5
      page.drawText(vals[j], { x: tx, y: y - 9, font: fontNormal, size: 7.5, color: DARK })
      cx += cols[j].w
    }
    y -= 14
  }

  // Totals
  y -= 2
  page.drawRectangle({ x: MARGIN, y: y - 14, width: COL_W, height: 16, color: rgb(0.9, 0.92, 0.95) })
  cx = MARGIN
  const totals = ['TOTALS', fmt(data.totalEmoluments, data.currency), fmt(data.ssnitContributions, data.currency), fmt(data.taxDeducted, data.currency)]
  for (let j = 0; j < cols.length; j++) {
    const tx = cols[j].align === 'right' ? cx + cols[j].w - 5 : cx + 5
    page.drawText(totals[j], { x: tx, y: y - 10, font: fontBold, size: 8, color: DARK })
    cx += cols[j].w
  }
  y -= 30

  // Summary section
  page.drawText('ANNUAL SUMMARY', { x: MARGIN, y, font: fontBold, size: 9, color: DARK })
  y -= 15
  const summaryItems = [
    ['Total Emoluments', fmt(data.totalEmoluments, data.currency)],
    ['Basic Salary', fmt(data.basicSalary, data.currency)],
    ['SSNIT Contributions (Tier 1)', fmt(data.ssnitContributions, data.currency)],
    ['Tier 2 Contributions', fmt(data.tier2Contributions, data.currency)],
    ['Total Tax Deducted', fmt(data.taxDeducted, data.currency)],
  ]
  for (const [label, value] of summaryItems) {
    page.drawText(label, { x: MARGIN + 10, y, font: fontNormal, size: 8, color: DARK })
    page.drawText(value, { x: MARGIN + 300, y, font: fontBold, size: 8, color: DARK })
    y -= 13
  }
  y -= 15

  // Footer
  page.drawText(`Generated on ${new Date().toLocaleDateString()} — This document is computer-generated and does not require a signature.`, {
    x: MARGIN, y, font: fontNormal, size: 7, color: LIGHT_GRAY,
  })

  return doc.save()
}
