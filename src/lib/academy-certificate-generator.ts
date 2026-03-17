/**
 * Academy Certificate Generator
 *
 * Generates professional PDF certificates using pdf-lib (already installed).
 * Also provides HTML preview generation for browser rendering.
 *
 * Certificates include:
 *  - Academy name and branding
 *  - "Certificate of Completion" title
 *  - Participant full name (prominent)
 *  - Certificate number
 *  - Issue date
 *  - Decorative border, seal, and signature line
 */

import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from 'pdf-lib'

// ============================================================
// TYPES
// ============================================================

export interface CertificateData {
  academyName: string
  certificateName: string // e.g., "Certificate of Completion"
  participantName: string
  certificateNumber: string
  issuedAt: Date | string
  brandColor?: string // hex color, default #2563eb
  logoUrl?: string
  academyDescription?: string // optional subtitle
  signatoryName?: string
  signatoryTitle?: string
}

// ============================================================
// COLOR HELPERS
// ============================================================

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.substring(0, 2), 16) / 255
  const g = parseInt(clean.substring(2, 4), 16) / 255
  const b = parseInt(clean.substring(4, 6), 16) / 255
  return { r, g, b }
}

function formatDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// ============================================================
// PDF GENERATION
// ============================================================

/**
 * Generate a professional PDF certificate using pdf-lib.
 * Returns a Buffer containing the PDF bytes.
 */
export async function generateCertificatePDF(data: CertificateData): Promise<Buffer> {
  const doc = await PDFDocument.create()

  // A4 landscape: 841.89 x 595.28 points
  const pageWidth = 841.89
  const pageHeight = 595.28
  const page = doc.addPage([pageWidth, pageHeight])

  // Embed fonts
  const fontRegular = await doc.embedFont(StandardFonts.TimesRoman)
  const fontBold = await doc.embedFont(StandardFonts.TimesRomanBold)
  const fontItalic = await doc.embedFont(StandardFonts.TimesRomanItalic)
  const fontSans = await doc.embedFont(StandardFonts.Helvetica)
  const fontSansBold = await doc.embedFont(StandardFonts.HelveticaBold)

  const brand = hexToRgb(data.brandColor || '#2563eb')
  const brandRgb = rgb(brand.r, brand.g, brand.b)
  const goldRgb = rgb(0.76, 0.60, 0.23) // #C29A3A
  const darkRgb = rgb(0.15, 0.15, 0.15)
  const mediumRgb = rgb(0.35, 0.35, 0.35)
  const lightGrayRgb = rgb(0.85, 0.85, 0.85)

  // ---- BACKGROUND ----
  page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: rgb(0.99, 0.98, 0.96) })

  // ---- OUTER DECORATIVE BORDER ----
  const borderInset = 20
  const borderWidth = 3
  // Outer gold border
  drawRectBorder(page, borderInset, borderInset, pageWidth - 2 * borderInset, pageHeight - 2 * borderInset, borderWidth, goldRgb)
  // Inner thin border
  drawRectBorder(page, borderInset + 10, borderInset + 10, pageWidth - 2 * (borderInset + 10), pageHeight - 2 * (borderInset + 10), 1, goldRgb)

  // ---- CORNER ORNAMENTS ----
  const cornerSize = 40
  const corners = [
    { x: borderInset + 15, y: pageHeight - borderInset - 15 }, // top-left
    { x: pageWidth - borderInset - 15, y: pageHeight - borderInset - 15 }, // top-right
    { x: borderInset + 15, y: borderInset + 15 }, // bottom-left
    { x: pageWidth - borderInset - 15, y: borderInset + 15 }, // bottom-right
  ]
  for (const corner of corners) {
    drawCornerOrnament(page, corner.x, corner.y, cornerSize, goldRgb)
  }

  // ---- TOP DECORATIVE LINE ----
  const topLineY = pageHeight - 85
  page.drawLine({ start: { x: 120, y: topLineY }, end: { x: pageWidth - 120, y: topLineY }, thickness: 1.5, color: goldRgb })

  // ---- ACADEMY NAME ----
  const academyNameY = topLineY - 35
  drawCenteredText(page, data.academyName.toUpperCase(), fontSansBold, 14, academyNameY, pageWidth, brandRgb, 3)

  // ---- CERTIFICATE TITLE ----
  const titleY = academyNameY - 55
  drawCenteredText(page, data.certificateName || 'Certificate of Completion', fontBold, 38, titleY, pageWidth, darkRgb)

  // ---- DECORATIVE DIVIDER ----
  const dividerY = titleY - 25
  const dividerHalf = 100
  const cx = pageWidth / 2
  page.drawLine({ start: { x: cx - dividerHalf - 40, y: dividerY }, end: { x: cx - 15, y: dividerY }, thickness: 1, color: goldRgb })
  page.drawEllipse({ x: cx, y: dividerY, xScale: 4, yScale: 4, color: goldRgb })
  page.drawLine({ start: { x: cx + 15, y: dividerY }, end: { x: cx + dividerHalf + 40, y: dividerY }, thickness: 1, color: goldRgb })

  // ---- "THIS CERTIFIES THAT" ----
  const prefixY = dividerY - 32
  drawCenteredText(page, 'This certifies that', fontItalic, 14, prefixY, pageWidth, mediumRgb)

  // ---- PARTICIPANT NAME ----
  const nameY = prefixY - 50
  drawCenteredText(page, data.participantName, fontBold, 32, nameY, pageWidth, darkRgb)

  // ---- UNDERLINE UNDER NAME ----
  const nameWidth = fontBold.widthOfTextAtSize(data.participantName, 32)
  const underlineX = (pageWidth - nameWidth) / 2
  page.drawLine({
    start: { x: underlineX - 20, y: nameY - 8 },
    end: { x: underlineX + nameWidth + 20, y: nameY - 8 },
    thickness: 1,
    color: goldRgb,
  })

  // ---- COMPLETION TEXT ----
  const completionY = nameY - 40
  const completionText = data.academyDescription
    ? `has successfully completed all requirements for the ${data.academyName}`
    : `has successfully completed all requirements of the ${data.academyName} program`
  drawCenteredText(page, completionText, fontRegular, 13, completionY, pageWidth, mediumRgb)

  if (data.academyDescription) {
    drawCenteredText(page, data.academyDescription, fontItalic, 11, completionY - 20, pageWidth, mediumRgb)
  }

  // ---- BOTTOM SECTION: DATE, SEAL, SIGNATURE ----
  const bottomY = 110

  // Date (left)
  const dateLabel = 'Date of Issue'
  const dateValue = formatDate(data.issuedAt)
  drawCenteredTextAt(page, dateValue, fontRegular, 13, 170, bottomY + 20, mediumRgb)
  page.drawLine({ start: { x: 100, y: bottomY + 8 }, end: { x: 240, y: bottomY + 8 }, thickness: 0.75, color: lightGrayRgb })
  drawCenteredTextAt(page, dateLabel, fontSans, 9, 170, bottomY - 5, mediumRgb)

  // Certificate number (center-bottom)
  const certNumLabel = `Certificate No. ${data.certificateNumber}`
  drawCenteredText(page, certNumLabel, fontSans, 9, 55, pageWidth, mediumRgb)

  // Seal (center)
  drawSeal(page, cx, bottomY + 15, 35, brandRgb, goldRgb, fontSansBold)

  // Signature (right)
  const sigName = data.signatoryName || 'Program Director'
  const sigTitle = data.signatoryTitle || 'Academy Administration'
  drawCenteredTextAt(page, sigName, fontItalic, 13, pageWidth - 170, bottomY + 20, mediumRgb)
  page.drawLine({ start: { x: pageWidth - 240, y: bottomY + 8 }, end: { x: pageWidth - 100, y: bottomY + 8 }, thickness: 0.75, color: lightGrayRgb })
  drawCenteredTextAt(page, sigTitle, fontSans, 9, pageWidth - 170, bottomY - 5, mediumRgb)

  // ---- BOTTOM DECORATIVE LINE ----
  page.drawLine({ start: { x: 120, y: 75 }, end: { x: pageWidth - 120, y: 75 }, thickness: 1.5, color: goldRgb })

  // Serialize
  const pdfBytes = await doc.save()
  return Buffer.from(pdfBytes)
}

// ============================================================
// PDF DRAWING HELPERS
// ============================================================

function drawCenteredText(
  page: PDFPage, text: string, font: PDFFont, size: number, y: number, pageWidth: number,
  color: ReturnType<typeof rgb>, letterSpacing?: number,
) {
  if (letterSpacing && letterSpacing > 0) {
    // Simulate letter spacing by drawing chars individually
    const chars = text.split('')
    const totalWidth = chars.reduce((sum, ch) => sum + font.widthOfTextAtSize(ch, size), 0) + (chars.length - 1) * letterSpacing
    let x = (pageWidth - totalWidth) / 2
    for (const ch of chars) {
      page.drawText(ch, { x, y, size, font, color })
      x += font.widthOfTextAtSize(ch, size) + letterSpacing
    }
  } else {
    const textWidth = font.widthOfTextAtSize(text, size)
    page.drawText(text, { x: (pageWidth - textWidth) / 2, y, size, font, color })
  }
}

function drawCenteredTextAt(
  page: PDFPage, text: string, font: PDFFont, size: number, cx: number, y: number,
  color: ReturnType<typeof rgb>,
) {
  const textWidth = font.widthOfTextAtSize(text, size)
  page.drawText(text, { x: cx - textWidth / 2, y, size, font, color })
}

function drawRectBorder(
  page: PDFPage, x: number, y: number, w: number, h: number, thickness: number,
  color: ReturnType<typeof rgb>,
) {
  // Draw 4 sides
  page.drawLine({ start: { x, y }, end: { x: x + w, y }, thickness, color })
  page.drawLine({ start: { x: x + w, y }, end: { x: x + w, y: y + h }, thickness, color })
  page.drawLine({ start: { x: x + w, y: y + h }, end: { x, y: y + h }, thickness, color })
  page.drawLine({ start: { x, y: y + h }, end: { x, y }, thickness, color })
}

function drawCornerOrnament(
  page: PDFPage, x: number, y: number, size: number, color: ReturnType<typeof rgb>,
) {
  // Small decorative diamond at each corner
  const s = size * 0.15
  page.drawEllipse({ x, y, xScale: s, yScale: s, color, opacity: 0.6 })
}

function drawSeal(
  page: PDFPage, cx: number, cy: number, radius: number,
  brandColor: ReturnType<typeof rgb>, goldColor: ReturnType<typeof rgb>,
  font: PDFFont,
) {
  // Outer circle (gold)
  page.drawEllipse({ x: cx, y: cy, xScale: radius + 5, yScale: radius + 5, color: goldColor })
  // Inner circle (brand)
  page.drawEllipse({ x: cx, y: cy, xScale: radius, yScale: radius, color: brandColor })
  // Inner ring
  page.drawEllipse({
    x: cx, y: cy, xScale: radius - 6, yScale: radius - 6,
    borderColor: rgb(1, 1, 1), borderWidth: 1.5, color: brandColor,
  })
  // Star/checkmark text
  const checkText = '\u2713'
  const checkSize = 22
  const checkWidth = font.widthOfTextAtSize(checkText, checkSize)
  page.drawText(checkText, {
    x: cx - checkWidth / 2,
    y: cy - checkSize / 3,
    size: checkSize,
    font,
    color: rgb(1, 1, 1),
  })
}

// ============================================================
// HTML GENERATION (for preview)
// ============================================================

/**
 * Generate an HTML string that renders the certificate.
 * Suitable for browser preview and print-to-PDF.
 */
export function generateCertificateHTML(data: CertificateData): string {
  const brandColor = data.brandColor || '#2563eb'
  const goldColor = '#C29A3A'
  const issuedDate = formatDate(data.issuedAt)
  const sigName = data.signatoryName || 'Program Director'
  const sigTitle = data.signatoryTitle || 'Academy Administration'

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${escapeHtml(data.certificateName)} - ${escapeHtml(data.participantName)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400;600&display=swap');

  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

  @page {
    size: A4 landscape;
    margin: 0;
  }

  body {
    width: 297mm;
    height: 210mm;
    margin: 0;
    padding: 0;
    font-family: 'Playfair Display', 'Times New Roman', Georgia, serif;
    background: #faf9f6;
    display: flex;
    align-items: center;
    justify-content: center;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .certificate {
    position: relative;
    width: 297mm;
    height: 210mm;
    background: linear-gradient(145deg, #fdfcfa 0%, #f8f6f0 50%, #fdfcfa 100%);
    overflow: hidden;
  }

  /* Outer border */
  .border-outer {
    position: absolute;
    inset: 12px;
    border: 3px solid ${goldColor};
    pointer-events: none;
  }

  /* Inner border */
  .border-inner {
    position: absolute;
    inset: 22px;
    border: 1px solid ${goldColor};
    pointer-events: none;
  }

  /* Corner ornaments */
  .corner {
    position: absolute;
    width: 40px;
    height: 40px;
  }
  .corner svg { width: 100%; height: 100%; }
  .corner-tl { top: 16px; left: 16px; }
  .corner-tr { top: 16px; right: 16px; transform: scaleX(-1); }
  .corner-bl { bottom: 16px; left: 16px; transform: scaleY(-1); }
  .corner-br { bottom: 16px; right: 16px; transform: scale(-1, -1); }

  /* Content area */
  .content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 50px 80px;
    text-align: center;
  }

  /* Top line */
  .top-line {
    width: 70%;
    height: 2px;
    background: linear-gradient(90deg, transparent, ${goldColor}, transparent);
    margin-bottom: 18px;
  }

  .academy-name {
    font-family: 'Inter', 'Helvetica Neue', sans-serif;
    font-weight: 600;
    font-size: 13px;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: ${brandColor};
    margin-bottom: 22px;
  }

  .certificate-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 40px;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 8px;
    line-height: 1.1;
  }

  /* Divider with diamond */
  .divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 14px 0;
  }
  .divider-line {
    width: 80px;
    height: 1px;
    background: ${goldColor};
  }
  .divider-diamond {
    width: 8px;
    height: 8px;
    background: ${goldColor};
    transform: rotate(45deg);
  }

  .prefix-text {
    font-style: italic;
    font-size: 15px;
    color: #555;
    margin-bottom: 14px;
  }

  .participant-name {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 34px;
    font-weight: 700;
    color: #1a1a1a;
    padding-bottom: 6px;
    border-bottom: 1.5px solid ${goldColor};
    margin-bottom: 14px;
    display: inline-block;
    padding-left: 20px;
    padding-right: 20px;
  }

  .completion-text {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 14px;
    color: #555;
    max-width: 500px;
    line-height: 1.6;
    margin-bottom: 6px;
  }

  .description {
    font-style: italic;
    font-size: 12px;
    color: #777;
    margin-bottom: 10px;
  }

  /* Bottom section */
  .bottom-section {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    width: 80%;
    margin-top: auto;
    padding-bottom: 10px;
  }

  .bottom-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 160px;
  }

  .bottom-value {
    font-size: 14px;
    color: #444;
    margin-bottom: 6px;
  }

  .bottom-line {
    width: 140px;
    height: 1px;
    background: #ccc;
    margin-bottom: 4px;
  }

  .bottom-label {
    font-family: 'Inter', sans-serif;
    font-size: 9px;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: #888;
  }

  /* Seal */
  .seal {
    position: relative;
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: ${goldColor};
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: -10px;
  }
  .seal-inner {
    width: 62px;
    height: 62px;
    border-radius: 50%;
    background: ${brandColor};
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid rgba(255,255,255,0.4);
  }
  .seal-check {
    color: white;
    font-size: 26px;
    line-height: 1;
  }

  /* Bottom line */
  .bottom-decorative-line {
    width: 70%;
    height: 2px;
    background: linear-gradient(90deg, transparent, ${goldColor}, transparent);
    margin-top: 8px;
  }

  .cert-number {
    font-family: 'Inter', sans-serif;
    font-size: 9px;
    color: #999;
    letter-spacing: 1px;
    margin-top: 6px;
  }

  @media print {
    body { background: white; }
    .certificate { box-shadow: none; }
  }
</style>
</head>
<body>
<div class="certificate">
  <div class="border-outer"></div>
  <div class="border-inner"></div>

  <!-- Corner ornaments -->
  <div class="corner corner-tl">
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 5 L5 35 M5 5 L35 5" stroke="${goldColor}" stroke-width="2" opacity="0.5"/>
      <circle cx="5" cy="5" r="3" fill="${goldColor}" opacity="0.6"/>
    </svg>
  </div>
  <div class="corner corner-tr">
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 5 L5 35 M5 5 L35 5" stroke="${goldColor}" stroke-width="2" opacity="0.5"/>
      <circle cx="5" cy="5" r="3" fill="${goldColor}" opacity="0.6"/>
    </svg>
  </div>
  <div class="corner corner-bl">
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 5 L5 35 M5 5 L35 5" stroke="${goldColor}" stroke-width="2" opacity="0.5"/>
      <circle cx="5" cy="5" r="3" fill="${goldColor}" opacity="0.6"/>
    </svg>
  </div>
  <div class="corner corner-br">
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 5 L5 35 M5 5 L35 5" stroke="${goldColor}" stroke-width="2" opacity="0.5"/>
      <circle cx="5" cy="5" r="3" fill="${goldColor}" opacity="0.6"/>
    </svg>
  </div>

  <div class="content">
    <div class="top-line"></div>

    <div class="academy-name">${escapeHtml(data.academyName)}</div>

    <div class="certificate-title">${escapeHtml(data.certificateName || 'Certificate of Completion')}</div>

    <div class="divider">
      <div class="divider-line"></div>
      <div class="divider-diamond"></div>
      <div class="divider-line"></div>
    </div>

    <div class="prefix-text">This certifies that</div>

    <div class="participant-name">${escapeHtml(data.participantName)}</div>

    <div class="completion-text">
      has successfully completed all requirements of the
      <strong>${escapeHtml(data.academyName)}</strong> program
    </div>

    ${data.academyDescription ? `<div class="description">${escapeHtml(data.academyDescription)}</div>` : ''}

    <div class="bottom-section">
      <div class="bottom-item">
        <div class="bottom-value">${escapeHtml(issuedDate)}</div>
        <div class="bottom-line"></div>
        <div class="bottom-label">Date of Issue</div>
      </div>

      <div class="seal">
        <div class="seal-inner">
          <span class="seal-check">\u2713</span>
        </div>
      </div>

      <div class="bottom-item">
        <div class="bottom-value" style="font-style: italic;">${escapeHtml(sigName)}</div>
        <div class="bottom-line"></div>
        <div class="bottom-label">${escapeHtml(sigTitle)}</div>
      </div>
    </div>

    <div class="bottom-decorative-line"></div>
    <div class="cert-number">Certificate No. ${escapeHtml(data.certificateNumber)}</div>
  </div>
</div>
</body>
</html>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
