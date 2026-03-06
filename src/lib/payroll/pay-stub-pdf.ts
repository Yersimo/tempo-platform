import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from 'pdf-lib'
import type { PayStub } from '@/lib/payroll-engine'

// ---------------------------------------------------------------------------
// Locale & format options
// ---------------------------------------------------------------------------

export type PayStubLocale = 'en' | 'fr'
export type PayStubFormat = 'standard' | 'bulletin_de_paie'

export interface PayStubOptions {
  locale?: PayStubLocale
  format?: PayStubFormat
  siret?: string               // French employer SIRET number
  conventionCollective?: string // French collective agreement name
  emploi?: string              // Job classification
  classification?: string      // e.g. "Cadre", "Non-cadre"
  dateEntree?: string           // Employment start date (dd/mm/yyyy)
}

// ---------------------------------------------------------------------------
// Translation map
// ---------------------------------------------------------------------------

const LABELS: Record<PayStubLocale, Record<string, string>> = {
  en: {
    title: 'PAY STUB',
    earnings: 'EARNINGS',
    deductions: 'DEDUCTIONS',
    netPay: 'NET PAY',
    baseSalary: 'Base Salary',
    overtime: 'Overtime',
    bonuses: 'Bonuses',
    totalEarnings: 'Total Earnings',
    federalTax: 'Federal Tax',
    stateTax: 'State / Provincial Tax',
    socialSecurity: 'Social Security',
    medicare: 'Medicare',
    pension: 'Pension',
    healthInsurance: 'Health Insurance',
    otherDeductions: 'Other Deductions',
    totalDeductions: 'Total Deductions',
    ytdSummary: 'YEAR-TO-DATE SUMMARY',
    ytdGross: 'Gross Earnings',
    ytdDeductions: 'Total Deductions',
    ytdFederal: 'Federal Tax',
    ytdSS: 'Social Security',
    ytdMedicare: 'Medicare',
    ytdNet: 'YTD Net Pay',
    employee: 'Employee',
    email: 'Email',
    jobTitle: 'Job Title',
    department: 'Department',
    country: 'Country',
    payPeriod: 'Pay Period',
    payDate: 'Pay Date',
    employeeId: 'Employee ID',
    payrollRun: 'Payroll Run',
    confidential: 'CONFIDENTIAL -- For employee use only',
    generatedOn: 'Generated on',
  },
  fr: {
    title: 'BULLETIN DE PAIE',
    earnings: 'RÉMUNÉRATION',
    deductions: 'COTISATIONS ET CONTRIBUTIONS',
    netPay: 'NET À PAYER',
    baseSalary: 'Salaire de base',
    overtime: 'Heures supplémentaires',
    bonuses: 'Primes',
    totalEarnings: 'Brut total',
    federalTax: 'Impôt sur le revenu (PAS)',
    stateTax: 'Contributions sociales',
    socialSecurity: 'Assurance maladie',
    medicare: 'CSG/CRDS',
    pension: 'Retraite',
    healthInsurance: 'Mutuelle',
    otherDeductions: 'Autres retenues',
    totalDeductions: 'Total des cotisations',
    ytdSummary: 'CUMULS ANNUELS',
    ytdGross: 'Brut cumulé',
    ytdDeductions: 'Cotisations cumulées',
    ytdFederal: 'PAS cumulé',
    ytdSS: 'Assurance maladie cumulée',
    ytdMedicare: 'CSG/CRDS cumulé',
    ytdNet: 'Net cumulé',
    employee: 'Salarié(e)',
    email: 'E-mail',
    jobTitle: 'Emploi',
    department: 'Service',
    country: 'Pays',
    payPeriod: 'Période de paie',
    payDate: 'Date de paiement',
    employeeId: 'Matricule',
    payrollRun: 'Référence paie',
    confidential: 'CONFIDENTIEL -- Réservé au salarié',
    generatedOn: 'Généré le',
  },
}

// French-specific labels
const FR_LABELS = {
  employer: 'EMPLOYEUR',
  employee_section: 'SALARIÉ(E)',
  siret: 'SIRET',
  convention: 'Convention collective',
  emploi: 'Emploi',
  classification: 'Classification',
  dateEntree: "Date d'entrée",
  base: 'Base',
  partSalariale: 'Part salariale',
  partPatronale: 'Part patronale',
  netImposable: 'Net imposable',
  netAvantImpot: 'Net avant impôt sur le revenu',
  pas: 'Prélèvement à la source (PAS)',
  netAPayer: 'NET À PAYER',
  assuranceMaladie: 'Assurance maladie',
  retraiteBase: 'Retraite de base',
  retraiteCompl: 'Retraite complémentaire',
  chomage: 'Assurance chômage',
  csgDeductible: 'CSG déductible',
  csgNonDeductible: 'CSG non déductible',
  crds: 'CRDS',
  legalFooter: 'Dans votre intérêt, conservez ce bulletin de paie sans limitation de durée.',
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function fmt(amount: number, currency: string, locale: PayStubLocale = 'en'): string {
  const intlLocale = locale === 'fr' ? 'fr-FR' : 'en-US'
  try {
    return new Intl.NumberFormat(intlLocale, {
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
  options?: PayStubOptions,
): Promise<Uint8Array> {
  // Auto-detect locale and format for French employees
  const isFrench = stub.country?.toUpperCase() === 'FR' || stub.country?.toUpperCase() === 'FRANCE'
  const locale: PayStubLocale = options?.locale ?? (isFrench ? 'fr' : 'en')
  const format: PayStubFormat = options?.format ?? (isFrench ? 'bulletin_de_paie' : 'standard')
  const L = LABELS[locale]

  // French bulletin de paie format
  if (format === 'bulletin_de_paie') {
    return generateBulletinDePaie(stub, companyName, locale, options)
  }

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

  const subtitle = L.title
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
    [L.employee, stub.employeeName],
    [L.email, stub.employeeEmail],
  ]
  if (stub.jobTitle) infoRows.push([L.jobTitle, stub.jobTitle])
  if (stub.department) infoRows.push([L.department, stub.department])
  if (stub.country) infoRows.push([L.country, stub.country])

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
    [L.payPeriod, stub.period],
    [L.payDate, stub.payDate],
    [L.employeeId, stub.employeeId.slice(0, 12)],
    [L.payrollRun, stub.payrollRunId.slice(0, 12)],
  ]
  for (const [label, value] of periodRows) {
    page.drawText(`${label}:`, { x: COL2_X, y: rightY, size: 9, color: COLOR_MUTED, font })
    page.drawText(value, { x: COL2_X + 80, y: rightY, size: 9, color: COLOR_PRIMARY, font: bold })
    rightY -= 14
  }

  ctx.y = Math.min(ctx.y, rightY) - 8

  // ── Earnings section ────────────────────────────────────────────────
  drawSectionHeader(ctx, L.earnings)

  drawTableRow(ctx, L.baseSalary, fmt(stub.earnings.baseSalary, stub.currency, locale))
  drawTableRow(ctx, L.overtime, fmt(stub.earnings.overtime, stub.currency, locale))
  drawTableRow(ctx, L.bonuses, fmt(stub.earnings.bonuses, stub.currency, locale))
  ctx.y -= 2
  drawLine(ctx, 6)
  ctx.y -= 4
  drawTableRow(ctx, L.totalEarnings, fmt(stub.earnings.totalEarnings, stub.currency, locale), {
    bold: true,
    valueColor: COLOR_ACCENT,
  })

  // ── Deductions section ──────────────────────────────────────────────
  drawSectionHeader(ctx, L.deductions)

  drawTableRow(ctx, L.federalTax, fmt(stub.deductions.federalTax, stub.currency, locale))
  drawTableRow(ctx, L.stateTax, fmt(stub.deductions.stateOrProvincialTax, stub.currency, locale))
  drawTableRow(ctx, L.socialSecurity, fmt(stub.deductions.socialSecurity, stub.currency, locale))
  drawTableRow(ctx, L.medicare, fmt(stub.deductions.medicare, stub.currency, locale))
  drawTableRow(ctx, L.pension, fmt(stub.deductions.pension, stub.currency, locale))
  drawTableRow(ctx, L.healthInsurance, fmt(stub.deductions.healthInsurance, stub.currency, locale))
  drawTableRow(ctx, L.otherDeductions, fmt(stub.deductions.otherDeductions, stub.currency, locale))
  ctx.y -= 2
  drawLine(ctx, 6)
  ctx.y -= 4
  drawTableRow(ctx, L.totalDeductions, fmt(stub.deductions.totalDeductions, stub.currency, locale), {
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

  const netLabel = L.netPay
  page.drawText(netLabel, {
    x: MARGIN_LEFT + 14,
    y: ctx.y + 4,
    size: 14,
    color: COLOR_PRIMARY,
    font: bold,
  })

  const netValue = fmt(stub.netPay, stub.currency, locale)
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
  drawSectionHeader(ctx, L.ytdSummary)

  drawTableRow(ctx, L.ytdGross, fmt(stub.ytd.grossEarnings, stub.currency, locale))
  drawTableRow(ctx, L.ytdDeductions, fmt(stub.ytd.totalDeductions, stub.currency, locale))
  drawTableRow(ctx, L.ytdFederal, fmt(stub.ytd.federalTax, stub.currency, locale))
  drawTableRow(ctx, L.ytdSS, fmt(stub.ytd.socialSecurity, stub.currency, locale))
  drawTableRow(ctx, L.ytdMedicare, fmt(stub.ytd.medicare, stub.currency, locale))
  ctx.y -= 2
  drawLine(ctx, 6)
  ctx.y -= 4
  drawTableRow(ctx, L.ytdNet, fmt(stub.ytd.netPay, stub.currency, locale), {
    bold: true,
    valueColor: COLOR_ACCENT,
  })

  // ── Footer ──────────────────────────────────────────────────────────
  const footerY = 40
  drawLine({ ...ctx, y: footerY + 10 }, 0)

  const timestamp = `${L.generatedOn} ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC`
  page.drawText(timestamp, {
    x: MARGIN_LEFT,
    y: footerY - 4,
    size: 7,
    color: COLOR_MUTED,
    font,
  })

  const confidential = L.confidential
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

// ---------------------------------------------------------------------------
// French Bulletin de Paie generator
// ---------------------------------------------------------------------------

async function generateBulletinDePaie(
  stub: PayStub,
  companyName: string,
  locale: PayStubLocale,
  options?: PayStubOptions,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  const ctx: DrawCtx = { page, font, bold, y: PAGE_HEIGHT - 50 }
  const f = (amount: number) => fmt(amount, stub.currency, 'fr')

  // ── Title ───────────────────────────────────────────────────────────
  const title = FR_LABELS.netAPayer.length > 0 ? 'BULLETIN DE PAIE' : 'BULLETIN DE PAIE'
  const titleWidth = bold.widthOfTextAtSize(title, 16)
  page.drawText(title, {
    x: (PAGE_WIDTH - titleWidth) / 2,
    y: ctx.y,
    size: 16,
    color: COLOR_PRIMARY,
    font: bold,
  })
  ctx.y -= 28

  drawLine(ctx, 4)
  ctx.y -= 8

  // ── Employer section ────────────────────────────────────────────────
  drawText(ctx, FR_LABELS.employer, MARGIN_LEFT, { size: 10, font: bold, color: COLOR_ACCENT })
  ctx.y -= 16
  drawText(ctx, companyName, MARGIN_LEFT, { size: 10, font: bold })
  ctx.y -= 14
  if (options?.siret) {
    drawText(ctx, `${FR_LABELS.siret}: ${options.siret}`, MARGIN_LEFT, { size: 9, color: COLOR_MUTED })
    ctx.y -= 14
  }
  if (options?.conventionCollective) {
    drawText(ctx, `${FR_LABELS.convention}: ${options.conventionCollective}`, MARGIN_LEFT, { size: 9, color: COLOR_MUTED })
    ctx.y -= 14
  }
  ctx.y -= 4

  // ── Employee section ────────────────────────────────────────────────
  drawLine(ctx, 4)
  ctx.y -= 4
  drawText(ctx, FR_LABELS.employee_section, MARGIN_LEFT, { size: 10, font: bold, color: COLOR_ACCENT })
  ctx.y -= 16

  const empRows: [string, string][] = [
    ['Nom', stub.employeeName],
    [FR_LABELS.emploi, options?.emploi || stub.jobTitle || '-'],
    [FR_LABELS.classification, options?.classification || '-'],
    [FR_LABELS.dateEntree, options?.dateEntree || '-'],
    ['Matricule', stub.employeeId.slice(0, 12)],
  ]

  for (const [label, value] of empRows) {
    drawText(ctx, `${label}:`, MARGIN_LEFT, { size: 9, color: COLOR_MUTED })
    drawText(ctx, value, MARGIN_LEFT + 120, { size: 9, font: bold })
    ctx.y -= 14
  }

  // Right side: period info
  let rightY = ctx.y + (empRows.length * 14)
  const COL2 = MARGIN_LEFT + CONTENT_WIDTH / 2 + 40
  const periodInfo: [string, string][] = [
    ['Période', stub.period],
    ['Date de paiement', stub.payDate],
  ]
  for (const [label, value] of periodInfo) {
    page.drawText(`${label}:`, { x: COL2, y: rightY, size: 9, color: COLOR_MUTED, font })
    page.drawText(value, { x: COL2 + 110, y: rightY, size: 9, color: COLOR_PRIMARY, font: bold })
    rightY -= 14
  }

  ctx.y -= 8

  // ── Rémunération section ────────────────────────────────────────────
  drawLine(ctx, 4)
  ctx.y -= 4
  drawText(ctx, 'RÉMUNÉRATION', MARGIN_LEFT, { size: 10, font: bold, color: COLOR_ACCENT })
  ctx.y -= 18

  drawTableRow(ctx, FR_LABELS.base === undefined ? 'Salaire de base' : 'Salaire de base', f(stub.earnings.baseSalary))
  drawTableRow(ctx, 'Heures supplémentaires', f(stub.earnings.overtime))
  drawTableRow(ctx, 'Primes et gratifications', f(stub.earnings.bonuses))
  ctx.y -= 2
  drawLine(ctx, 6)
  ctx.y -= 4
  drawTableRow(ctx, 'SALAIRE BRUT', f(stub.earnings.totalEarnings), { bold: true, valueColor: COLOR_ACCENT })

  // ── Cotisations section ─────────────────────────────────────────────
  ctx.y -= 6
  drawLine(ctx, 4)
  ctx.y -= 4

  // Three-column header: Cotisation | Part salariale | Part patronale
  drawText(ctx, 'COTISATIONS', MARGIN_LEFT, { size: 10, font: bold, color: COLOR_ACCENT })
  const colSal = PAGE_WIDTH - MARGIN_RIGHT - 200
  const colPat = PAGE_WIDTH - MARGIN_RIGHT - 80
  drawText(ctx, FR_LABELS.partSalariale, colSal, { size: 8, color: COLOR_MUTED })
  drawText(ctx, FR_LABELS.partPatronale, colPat, { size: 8, color: COLOR_MUTED })
  ctx.y -= 16

  // Cotisation rows (employee amounts from deductions, employer amounts estimated)
  const cotisations = [
    { label: FR_LABELS.assuranceMaladie, employee: stub.deductions.socialSecurity * 0.3, employer: stub.deductions.socialSecurity * 0.7 },
    { label: FR_LABELS.retraiteBase, employee: stub.deductions.pension * 0.45, employer: stub.deductions.pension * 0.55 },
    { label: FR_LABELS.retraiteCompl, employee: stub.deductions.pension * 0.15, employer: stub.deductions.pension * 0.2 },
    { label: FR_LABELS.chomage, employee: 0, employer: stub.deductions.socialSecurity * 0.3 },
    { label: FR_LABELS.csgDeductible, employee: stub.deductions.medicare * 0.7, employer: 0 },
    { label: FR_LABELS.csgNonDeductible, employee: stub.deductions.medicare * 0.2, employer: 0 },
    { label: FR_LABELS.crds, employee: stub.deductions.medicare * 0.1, employer: 0 },
  ]

  for (const row of cotisations) {
    drawText(ctx, row.label, MARGIN_LEFT + 10, { size: 9 })
    const empVal = f(row.employee)
    const empWidth = font.widthOfTextAtSize(empVal, 9)
    drawText(ctx, empVal, colSal + 60 - empWidth, { size: 9 })
    if (row.employer > 0) {
      const patVal = f(row.employer)
      const patWidth = font.widthOfTextAtSize(patVal, 9)
      drawText(ctx, patVal, colPat + 60 - patWidth, { size: 9, color: COLOR_MUTED })
    }
    ctx.y -= 14
  }

  ctx.y -= 2
  drawLine(ctx, 6)
  ctx.y -= 4
  drawTableRow(ctx, 'Total des cotisations', f(stub.deductions.totalDeductions), {
    bold: true,
    valueColor: rgb(0.75, 0.15, 0.15),
  })

  // ── Net section ─────────────────────────────────────────────────────
  ctx.y -= 8

  // Net imposable (gross - deductible social contributions)
  const netImposable = stub.earnings.totalEarnings - (stub.deductions.totalDeductions - stub.deductions.federalTax)
  drawTableRow(ctx, FR_LABELS.netImposable, f(netImposable), { size: 9 })

  // Net avant impôt
  const netAvantImpot = stub.earnings.totalEarnings - (stub.deductions.totalDeductions - stub.deductions.federalTax)
  drawTableRow(ctx, FR_LABELS.netAvantImpot, f(netAvantImpot), { bold: true })

  // PAS (prélèvement à la source)
  drawTableRow(ctx, FR_LABELS.pas, f(stub.deductions.federalTax), {
    valueColor: rgb(0.75, 0.15, 0.15),
  })

  // Net à payer box
  ctx.y -= 8
  const netBoxH = 36
  page.drawRectangle({
    x: MARGIN_LEFT,
    y: ctx.y - 8,
    width: CONTENT_WIDTH,
    height: netBoxH,
    color: COLOR_NET_BG,
    borderColor: COLOR_ACCENT,
    borderWidth: 1.5,
  })

  page.drawText(FR_LABELS.netAPayer, {
    x: MARGIN_LEFT + 14,
    y: ctx.y + 4,
    size: 14,
    color: COLOR_PRIMARY,
    font: bold,
  })

  const netVal = f(stub.netPay)
  const netW = bold.widthOfTextAtSize(netVal, 18)
  page.drawText(netVal, {
    x: PAGE_WIDTH - MARGIN_RIGHT - 14 - netW,
    y: ctx.y + 2,
    size: 18,
    color: COLOR_ACCENT,
    font: bold,
  })

  ctx.y -= netBoxH + 12

  // ── YTD (Cumuls) ────────────────────────────────────────────────────
  if (ctx.y > 120) {
    drawSectionHeader(ctx, 'CUMULS ANNUELS')
    drawTableRow(ctx, 'Brut cumulé', f(stub.ytd.grossEarnings))
    drawTableRow(ctx, 'Cotisations cumulées', f(stub.ytd.totalDeductions))
    drawTableRow(ctx, 'PAS cumulé', f(stub.ytd.federalTax))
    ctx.y -= 2
    drawLine(ctx, 6)
    ctx.y -= 4
    drawTableRow(ctx, 'Net cumulé', f(stub.ytd.netPay), { bold: true, valueColor: COLOR_ACCENT })
  }

  // ── Footer ──────────────────────────────────────────────────────────
  const footerY = 40
  drawLine({ ...ctx, y: footerY + 18 }, 0)

  // Legal footer (French law requirement)
  page.drawText(FR_LABELS.legalFooter, {
    x: MARGIN_LEFT,
    y: footerY + 4,
    size: 7,
    color: COLOR_MUTED,
    font,
  })

  const timestamp = `Généré le ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC`
  page.drawText(timestamp, {
    x: MARGIN_LEFT,
    y: footerY - 10,
    size: 7,
    color: COLOR_MUTED,
    font,
  })

  const confText = 'CONFIDENTIEL -- Réservé au salarié'
  const confW = font.widthOfTextAtSize(confText, 7)
  page.drawText(confText, {
    x: PAGE_WIDTH - MARGIN_RIGHT - confW,
    y: footerY - 10,
    size: 7,
    color: COLOR_MUTED,
    font,
  })

  const pdfBytes = await doc.save()
  return pdfBytes
}
