import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from 'pdf-lib'
import type { PayStub } from '@/lib/payroll-engine'

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function fmt(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount)
  } catch {
    // Fallback when Intl does not recognise the currency code
    return `${currency} ${amount.toFixed(2)}`
  }
}

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------

const PAGE_WIDTH = 612 // US Letter
const PAGE_HEIGHT = 792
const MARGIN_LEFT = 50
const MARGIN_RIGHT = 50
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT

const COLOR_PRIMARY = rgb(0.13, 0.15, 0.23) // Dark navy
const COLOR_ACCENT = rgb(0.18, 0.42, 0.87) // Blue
const COLOR_MUTED = rgb(0.45, 0.47, 0.53) // Grey text
const COLOR_DIVIDER = rgb(0.82, 0.84, 0.88) // Light grey
const COLOR_NET_BG = rgb(0.94, 0.97, 1.0) // Very light blue

// ---------------------------------------------------------------------------
// Drawing helpers
// ---------------------------------------------------------------------------

interface DrawCtx {
  page: PDFPage
  font: PDFFont
  bold: PDFFont
  y: number
}

function drawText(
  ctx: DrawCtx,
  text: string,
  x: number,
  opts?: { size?: number; color?: ReturnType<typeof rgb>; font?: PDFFont },
) {
  const size = opts?.size ?? 10
  const color = opts?.color ?? COLOR_PRIMARY
  const usedFont = opts?.font ?? ctx.font
  ctx.page.drawText(text, { x, y: ctx.y, size, color, font: usedFont })
}

function drawLine(ctx: DrawCtx, yOffset = 0) {
  const lineY = ctx.y + yOffset
  ctx.page.drawLine({
    start: { x: MARGIN_LEFT, y: lineY },
    end: { x: PAGE_WIDTH - MARGIN_RIGHT, y: lineY },
    thickness: 0.5,
    color: COLOR_DIVIDER,
  })
}

function drawTableRow(
  ctx: DrawCtx,
  label: string,
  value: string,
  opts?: { bold?: boolean; size?: number; labelColor?: ReturnType<typeof rgb>; valueColor?: ReturnType<typeof rgb> },
) {
  const size = opts?.size ?? 10
  const labelColor = opts?.labelColor ?? COLOR_PRIMARY
  const valueColor = opts?.valueColor ?? COLOR_PRIMARY
  const usedFont = opts?.bold ? ctx.bold : ctx.font

  ctx.page.drawText(label, { x: MARGIN_LEFT + 10, y: ctx.y, size, color: labelColor, font: usedFont })

  const valueWidth = usedFont.widthOfTextAtSize(value, size)
  ctx.page.drawText(value, {
    x: PAGE_WIDTH - MARGIN_RIGHT - 10 - valueWidth,
    y: ctx.y,
    size,
    color: valueColor,
    font: usedFont,
  })

  ctx.y -= size + 6
}

function drawSectionHeader(ctx: DrawCtx, title: string) {
  ctx.y -= 6
  drawLine(ctx, 4)
  ctx.y -= 4

  ctx.page.drawText(title, {
    x: MARGIN_LEFT,
    y: ctx.y,
    size: 11,
    color: COLOR_ACCENT,
    font: ctx.bold,
  })
  ctx.y -= 18
}

// ---------------------------------------------------------------------------
// PDF generator
// ---------------------------------------------------------------------------

export async function generatePayStubPDF(
  stub: PayStub,
  companyName: string = 'Tempo HR',
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  const ctx: DrawCtx = { page, font, bold, y: PAGE_HEIGHT - 50 }

  // ── Company header ──────────────────────────────────────────────────
  page.drawText(companyName, {
    x: MARGIN_LEFT,
    y: ctx.y,
    size: 22,
    color: COLOR_PRIMARY,
    font: bold,
  })

  const subtitle = 'PAY STUB'
  const subtitleWidth = bold.widthOfTextAtSize(subtitle, 14)
  page.drawText(subtitle, {
    x: PAGE_WIDTH - MARGIN_RIGHT - subtitleWidth,
    y: ctx.y,
    size: 14,
    color: COLOR_ACCENT,
    font: bold,
  })
  ctx.y -= 30

  drawLine(ctx, 4)
  ctx.y -= 8

  // ── Employee information ────────────────────────────────────────────
  const infoRows: [string, string][] = [
    ['Employee', stub.employeeName],
    ['Email', stub.employeeEmail],
  ]
  if (stub.jobTitle) infoRows.push(['Job Title', stub.jobTitle])
  if (stub.department) infoRows.push(['Department', stub.department])
  if (stub.country) infoRows.push(['Country', stub.country])

  const COL2_X = MARGIN_LEFT + CONTENT_WIDTH / 2 + 20

  // Left column — employee info
  const leftStartY = ctx.y
  for (const [label, value] of infoRows) {
    page.drawText(`${label}:`, { x: MARGIN_LEFT, y: ctx.y, size: 9, color: COLOR_MUTED, font })
    page.drawText(value, { x: MARGIN_LEFT + 75, y: ctx.y, size: 9, color: COLOR_PRIMARY, font: bold })
    ctx.y -= 14
  }

  // Right column — pay period info
  let rightY = leftStartY
  const periodRows: [string, string][] = [
    ['Pay Period', stub.period],
    ['Pay Date', stub.payDate],
    ['Employee ID', stub.employeeId.slice(0, 12)],
    ['Payroll Run', stub.payrollRunId.slice(0, 12)],
  ]
  for (const [label, value] of periodRows) {
    page.drawText(`${label}:`, { x: COL2_X, y: rightY, size: 9, color: COLOR_MUTED, font })
    page.drawText(value, { x: COL2_X + 80, y: rightY, size: 9, color: COLOR_PRIMARY, font: bold })
    rightY -= 14
  }

  ctx.y = Math.min(ctx.y, rightY) - 8

  // ── Earnings section ────────────────────────────────────────────────
  drawSectionHeader(ctx, 'EARNINGS')

  drawTableRow(ctx, 'Base Salary', fmt(stub.earnings.baseSalary, stub.currency))
  drawTableRow(ctx, 'Overtime', fmt(stub.earnings.overtime, stub.currency))
  drawTableRow(ctx, 'Bonuses', fmt(stub.earnings.bonuses, stub.currency))
  ctx.y -= 2
  drawLine(ctx, 6)
  ctx.y -= 4
  drawTableRow(ctx, 'Total Earnings', fmt(stub.earnings.totalEarnings, stub.currency), {
    bold: true,
    valueColor: COLOR_ACCENT,
  })

  // ── Deductions section ──────────────────────────────────────────────
  drawSectionHeader(ctx, 'DEDUCTIONS')

  drawTableRow(ctx, 'Federal Tax', fmt(stub.deductions.federalTax, stub.currency))
  drawTableRow(ctx, 'State / Provincial Tax', fmt(stub.deductions.stateOrProvincialTax, stub.currency))
  drawTableRow(ctx, 'Social Security', fmt(stub.deductions.socialSecurity, stub.currency))
  drawTableRow(ctx, 'Medicare', fmt(stub.deductions.medicare, stub.currency))
  drawTableRow(ctx, 'Pension', fmt(stub.deductions.pension, stub.currency))
  drawTableRow(ctx, 'Health Insurance', fmt(stub.deductions.healthInsurance, stub.currency))
  drawTableRow(ctx, 'Other Deductions', fmt(stub.deductions.otherDeductions, stub.currency))
  ctx.y -= 2
  drawLine(ctx, 6)
  ctx.y -= 4
  drawTableRow(ctx, 'Total Deductions', fmt(stub.deductions.totalDeductions, stub.currency), {
    bold: true,
    valueColor: rgb(0.75, 0.15, 0.15),
  })

  // ── Net Pay ─────────────────────────────────────────────────────────
  ctx.y -= 8
  const netBoxHeight = 36
  page.drawRectangle({
    x: MARGIN_LEFT,
    y: ctx.y - 8,
    width: CONTENT_WIDTH,
    height: netBoxHeight,
    color: COLOR_NET_BG,
    borderColor: COLOR_ACCENT,
    borderWidth: 1,
  })

  const netLabel = 'NET PAY'
  page.drawText(netLabel, {
    x: MARGIN_LEFT + 14,
    y: ctx.y + 4,
    size: 14,
    color: COLOR_PRIMARY,
    font: bold,
  })

  const netValue = fmt(stub.netPay, stub.currency)
  const netValueWidth = bold.widthOfTextAtSize(netValue, 18)
  page.drawText(netValue, {
    x: PAGE_WIDTH - MARGIN_RIGHT - 14 - netValueWidth,
    y: ctx.y + 2,
    size: 18,
    color: COLOR_ACCENT,
    font: bold,
  })

  ctx.y -= netBoxHeight + 8

  // ── YTD Summary ─────────────────────────────────────────────────────
  drawSectionHeader(ctx, 'YEAR-TO-DATE SUMMARY')

  drawTableRow(ctx, 'Gross Earnings', fmt(stub.ytd.grossEarnings, stub.currency))
  drawTableRow(ctx, 'Total Deductions', fmt(stub.ytd.totalDeductions, stub.currency))
  drawTableRow(ctx, 'Federal Tax', fmt(stub.ytd.federalTax, stub.currency))
  drawTableRow(ctx, 'Social Security', fmt(stub.ytd.socialSecurity, stub.currency))
  drawTableRow(ctx, 'Medicare', fmt(stub.ytd.medicare, stub.currency))
  ctx.y -= 2
  drawLine(ctx, 6)
  ctx.y -= 4
  drawTableRow(ctx, 'YTD Net Pay', fmt(stub.ytd.netPay, stub.currency), {
    bold: true,
    valueColor: COLOR_ACCENT,
  })

  // ── Footer ──────────────────────────────────────────────────────────
  const footerY = 40
  drawLine({ ...ctx, y: footerY + 10 }, 0)

  const timestamp = `Generated on ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC`
  page.drawText(timestamp, {
    x: MARGIN_LEFT,
    y: footerY - 4,
    size: 7,
    color: COLOR_MUTED,
    font,
  })

  const confidential = 'CONFIDENTIAL -- For employee use only'
  const confWidth = font.widthOfTextAtSize(confidential, 7)
  page.drawText(confidential, {
    x: PAGE_WIDTH - MARGIN_RIGHT - confWidth,
    y: footerY - 4,
    size: 7,
    color: COLOR_MUTED,
    font,
  })

  // ── Serialise ───────────────────────────────────────────────────────
  const pdfBytes = await doc.save()
  return pdfBytes
}
