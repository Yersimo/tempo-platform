import type { PDFDocument, PDFFont, PDFPage } from 'pdf-lib'
import {
  PAGE_WIDTH,
  PAGE_HEIGHT,
  MARGIN,
  CONTENT_WIDTH,
  COLORS,
  FONT_SIZE,
  LINE_HEIGHT,
} from './constants'

// ─── DocPdfBuilder ──────────────────────────────────────────────────────────
// Multi-page pdf-lib wrapper with auto-pagination, word wrapping, and
// enterprise-grade layout primitives. Designed for Tempo Help Center guides.

export class DocPdfBuilder {
  private doc: PDFDocument
  private font: PDFFont
  private bold: PDFFont
  private currentPage!: PDFPage
  private y: number
  private pageNumber: number

  constructor(doc: PDFDocument, font: PDFFont, bold: PDFFont) {
    this.doc = doc
    this.font = font
    this.bold = bold
    this.y = PAGE_HEIGHT - MARGIN.top
    this.pageNumber = 0
  }

  // ── Page management ─────────────────────────────────────────────────────

  /** Add a new page, reset the y cursor, and increment page counter. */
  addPage(): void {
    this.currentPage = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    this.pageNumber++
    this.y = PAGE_HEIGHT - MARGIN.top
  }

  /** If the remaining vertical space is less than `needed`, start a new page. */
  ensureSpace(needed: number): void {
    if (this.y - needed < MARGIN.bottom) {
      this.drawFooter()
      this.addPage()
    }
  }

  /** Get the current y position (useful for cover page or custom drawing). */
  getY(): number {
    return this.y
  }

  /** Set the y position manually (useful for cover page layout). */
  setY(y: number): void {
    this.y = y
  }

  /** Get the current page (for custom drawing operations). */
  getPage(): PDFPage {
    return this.currentPage
  }

  /** Get the current page number. */
  getPageNumber(): number {
    return this.pageNumber
  }

  // ── Text measurement helpers ────────────────────────────────────────────

  private measureText(text: string, fontSize: number, usedFont?: PDFFont): number {
    return (usedFont ?? this.font).widthOfTextAtSize(text, fontSize)
  }

  /**
   * Word-wrap text to fit within `maxWidth`. Returns an array of lines.
   * Handles long unbreakable words by forcing them onto their own line.
   */
  private wrapText(text: string, fontSize: number, maxWidth: number, usedFont?: PDFFont): string[] {
    const f = usedFont ?? this.font
    const words = text.split(/\s+/)
    const lines: string[] = []
    let currentLine = ''

    for (const word of words) {
      if (!currentLine) {
        currentLine = word
        continue
      }
      const testLine = currentLine + ' ' + word
      const testWidth = f.widthOfTextAtSize(testLine, fontSize)
      if (testWidth <= maxWidth) {
        currentLine = testLine
      } else {
        lines.push(currentLine)
        currentLine = word
      }
    }
    if (currentLine) {
      lines.push(currentLine)
    }
    return lines.length > 0 ? lines : ['']
  }

  // ── Drawing primitives ──────────────────────────────────────────────────

  /** Large centered title (used for section openers on content pages). */
  drawTitle(text: string): void {
    this.ensureSpace(FONT_SIZE.TITLE + 20)
    const textWidth = this.measureText(text, FONT_SIZE.TITLE, this.bold)
    const x = MARGIN.left + (CONTENT_WIDTH - textWidth) / 2
    this.currentPage.drawText(text, {
      x: Math.max(MARGIN.left, x),
      y: this.y,
      size: FONT_SIZE.TITLE,
      font: this.bold,
      color: COLORS.PRIMARY,
    })
    this.y -= LINE_HEIGHT.TITLE + 8
  }

  /** Section header with an orange accent bar above. */
  drawH1(text: string): void {
    this.ensureSpace(LINE_HEIGHT.H1 + 24)
    // Orange accent rectangle
    this.currentPage.drawRectangle({
      x: MARGIN.left,
      y: this.y + 6,
      width: 40,
      height: 3,
      color: COLORS.ACCENT,
    })
    this.y -= 8
    this.currentPage.drawText(text, {
      x: MARGIN.left,
      y: this.y,
      size: FONT_SIZE.H1,
      font: this.bold,
      color: COLORS.PRIMARY,
    })
    this.y -= LINE_HEIGHT.H1 + 6
  }

  /** Subsection header. */
  drawH2(text: string): void {
    this.ensureSpace(LINE_HEIGHT.H2 + 12)
    this.currentPage.drawText(text, {
      x: MARGIN.left,
      y: this.y,
      size: FONT_SIZE.H2,
      font: this.bold,
      color: COLORS.PRIMARY,
    })
    this.y -= LINE_HEIGHT.H2 + 4
  }

  /** Minor header. */
  drawH3(text: string): void {
    this.ensureSpace(LINE_HEIGHT.H3 + 8)
    this.currentPage.drawText(text, {
      x: MARGIN.left,
      y: this.y,
      size: FONT_SIZE.H3,
      font: this.bold,
      color: COLORS.MUTED,
    })
    this.y -= LINE_HEIGHT.H3 + 2
  }

  /** Body paragraph with word wrapping. */
  drawBody(text: string): void {
    const lines = this.wrapText(text, FONT_SIZE.BODY, CONTENT_WIDTH)
    for (const line of lines) {
      this.ensureSpace(LINE_HEIGHT.BODY)
      this.currentPage.drawText(line, {
        x: MARGIN.left,
        y: this.y,
        size: FONT_SIZE.BODY,
        font: this.font,
        color: COLORS.PRIMARY,
      })
      this.y -= LINE_HEIGHT.BODY
    }
    this.y -= 4
  }

  /** Bulleted list item with word wrapping for the text portion. */
  drawBullet(text: string): void {
    const bulletIndent = 14
    const bulletChar = '\u2022' // bullet character
    const availableWidth = CONTENT_WIDTH - bulletIndent

    const lines = this.wrapText(text, FONT_SIZE.BODY, availableWidth)
    for (let i = 0; i < lines.length; i++) {
      this.ensureSpace(LINE_HEIGHT.BODY)
      if (i === 0) {
        // Draw bullet on first line
        this.currentPage.drawText(bulletChar, {
          x: MARGIN.left + 2,
          y: this.y,
          size: FONT_SIZE.BODY,
          font: this.font,
          color: COLORS.ACCENT,
        })
      }
      this.currentPage.drawText(lines[i], {
        x: MARGIN.left + bulletIndent,
        y: this.y,
        size: FONT_SIZE.BODY,
        font: this.font,
        color: COLORS.PRIMARY,
      })
      this.y -= LINE_HEIGHT.BODY
    }
    this.y -= 2
  }

  /** Numbered step with title in bold and description wrapped below. */
  drawNumberedItem(num: number, title: string, desc: string): void {
    const numStr = `${num}.`
    const numIndent = 20
    const textIndent = numIndent

    // Number + title line
    this.ensureSpace(LINE_HEIGHT.BODY * 2 + 10)
    this.currentPage.drawText(numStr, {
      x: MARGIN.left,
      y: this.y,
      size: FONT_SIZE.BODY,
      font: this.bold,
      color: COLORS.ACCENT,
    })
    // Title in bold, may wrap
    const titleLines = this.wrapText(title, FONT_SIZE.BODY, CONTENT_WIDTH - textIndent, this.bold)
    for (let i = 0; i < titleLines.length; i++) {
      if (i > 0) {
        this.ensureSpace(LINE_HEIGHT.BODY)
      }
      this.currentPage.drawText(titleLines[i], {
        x: MARGIN.left + textIndent,
        y: this.y,
        size: FONT_SIZE.BODY,
        font: this.bold,
        color: COLORS.PRIMARY,
      })
      this.y -= LINE_HEIGHT.BODY
    }

    // Description lines indented
    if (desc) {
      const descLines = this.wrapText(desc, FONT_SIZE.BODY, CONTENT_WIDTH - textIndent)
      for (const line of descLines) {
        this.ensureSpace(LINE_HEIGHT.BODY)
        this.currentPage.drawText(line, {
          x: MARGIN.left + textIndent,
          y: this.y,
          size: FONT_SIZE.BODY,
          font: this.font,
          color: COLORS.MUTED,
        })
        this.y -= LINE_HEIGHT.BODY
      }
    }
    this.y -= 4
  }

  /** Orange-tinted tip callout box. */
  drawTipBox(text: string): void {
    const boxPadding = 10
    const labelText = 'Tip:  '
    const labelWidth = this.measureText(labelText, FONT_SIZE.BODY, this.bold)
    const availableWidth = CONTENT_WIDTH - boxPadding * 2 - labelWidth
    const bodyLines = this.wrapText(text, FONT_SIZE.BODY, availableWidth)

    // First line also includes the label, so check if it fits together
    const firstLineWithLabel = this.wrapText(text, FONT_SIZE.BODY, availableWidth)
    const totalLines = firstLineWithLabel.length
    const boxHeight = boxPadding * 2 + totalLines * LINE_HEIGHT.BODY + 2

    this.ensureSpace(boxHeight + 8)

    // Background rectangle
    this.currentPage.drawRectangle({
      x: MARGIN.left,
      y: this.y - boxHeight + LINE_HEIGHT.BODY + boxPadding,
      width: CONTENT_WIDTH,
      height: boxHeight,
      color: COLORS.TIP_BG,
      borderColor: COLORS.ACCENT,
      borderWidth: 0.5,
    })

    // Left accent stripe
    this.currentPage.drawRectangle({
      x: MARGIN.left,
      y: this.y - boxHeight + LINE_HEIGHT.BODY + boxPadding,
      width: 3,
      height: boxHeight,
      color: COLORS.ACCENT,
    })

    // "Tip:" label
    const textX = MARGIN.left + boxPadding + 4
    this.currentPage.drawText(labelText, {
      x: textX,
      y: this.y,
      size: FONT_SIZE.BODY,
      font: this.bold,
      color: COLORS.ACCENT,
    })

    // Body text
    for (let i = 0; i < bodyLines.length; i++) {
      const x = i === 0 ? textX + labelWidth : textX
      const lineWidth = i === 0 ? availableWidth : CONTENT_WIDTH - boxPadding * 2 - 4
      const lineText = i === 0 ? bodyLines[i] : bodyLines[i]

      // Re-wrap for subsequent lines that get more width
      if (i === 0) {
        this.currentPage.drawText(lineText, {
          x,
          y: this.y,
          size: FONT_SIZE.BODY,
          font: this.font,
          color: COLORS.PRIMARY,
        })
      } else {
        this.currentPage.drawText(lineText, {
          x: textX,
          y: this.y,
          size: FONT_SIZE.BODY,
          font: this.font,
          color: COLORS.PRIMARY,
        })
      }
      this.y -= LINE_HEIGHT.BODY
    }

    this.y -= boxPadding + 4
  }

  /**
   * Simple table with headers and rows.
   * Columns auto-size based on content width. Alternating row backgrounds.
   */
  drawTable(headers: string[], rows: string[][]): void {
    if (headers.length === 0) return

    const colCount = headers.length
    const cellPadding = 6
    const rowHeight = LINE_HEIGHT.BODY + cellPadding * 2
    const colWidths = this.calculateColumnWidths(headers, rows, colCount)

    // Header row
    this.ensureSpace(rowHeight * 2)
    this.drawTableRowBg(this.y + LINE_HEIGHT.BODY + cellPadding, rowHeight, COLORS.PRIMARY)

    let x = MARGIN.left
    for (let c = 0; c < colCount; c++) {
      const truncated = this.truncateText(headers[c], FONT_SIZE.SMALL, colWidths[c] - cellPadding * 2, this.bold)
      this.currentPage.drawText(truncated, {
        x: x + cellPadding,
        y: this.y,
        size: FONT_SIZE.SMALL,
        font: this.bold,
        color: COLORS.WHITE,
      })
      x += colWidths[c]
    }
    this.y -= rowHeight

    // Data rows
    for (let r = 0; r < rows.length; r++) {
      this.ensureSpace(rowHeight)
      const bgColor = r % 2 === 0 ? COLORS.LIGHT_BG : COLORS.WHITE
      this.drawTableRowBg(this.y + LINE_HEIGHT.BODY + cellPadding, rowHeight, bgColor)

      // Bottom border
      this.currentPage.drawLine({
        start: { x: MARGIN.left, y: this.y - cellPadding },
        end: { x: MARGIN.left + CONTENT_WIDTH, y: this.y - cellPadding },
        thickness: 0.25,
        color: COLORS.DIVIDER,
      })

      x = MARGIN.left
      for (let c = 0; c < colCount; c++) {
        const cellText = rows[r]?.[c] ?? ''
        const truncated = this.truncateText(cellText, FONT_SIZE.SMALL, colWidths[c] - cellPadding * 2)
        this.currentPage.drawText(truncated, {
          x: x + cellPadding,
          y: this.y,
          size: FONT_SIZE.SMALL,
          font: this.font,
          color: COLORS.PRIMARY,
        })
        x += colWidths[c]
      }
      this.y -= rowHeight
    }
    this.y -= 6
  }

  private drawTableRowBg(
    topY: number,
    height: number,
    color: ReturnType<typeof import('pdf-lib').rgb>,
  ): void {
    this.currentPage.drawRectangle({
      x: MARGIN.left,
      y: topY - height,
      width: CONTENT_WIDTH,
      height,
      color,
    })
  }

  private calculateColumnWidths(
    headers: string[],
    rows: string[][],
    colCount: number,
  ): number[] {
    // Measure the widest content in each column
    const minWidths: number[] = []
    for (let c = 0; c < colCount; c++) {
      let maxW = this.measureText(headers[c], FONT_SIZE.SMALL, this.bold)
      for (const row of rows) {
        const cellText = row[c] ?? ''
        const w = this.measureText(cellText, FONT_SIZE.SMALL)
        if (w > maxW) maxW = w
      }
      minWidths.push(maxW + 16) // padding
    }

    // Distribute remaining space proportionally
    const totalMin = minWidths.reduce((sum, w) => sum + w, 0)
    if (totalMin >= CONTENT_WIDTH) {
      // Columns are too wide; scale down proportionally
      const scale = CONTENT_WIDTH / totalMin
      return minWidths.map((w) => Math.floor(w * scale))
    }

    const extra = CONTENT_WIDTH - totalMin
    const share = extra / colCount
    return minWidths.map((w) => w + share)
  }

  private truncateText(text: string, fontSize: number, maxWidth: number, usedFont?: PDFFont): string {
    const f = usedFont ?? this.font
    if (f.widthOfTextAtSize(text, fontSize) <= maxWidth) return text
    let truncated = text
    while (truncated.length > 0 && f.widthOfTextAtSize(truncated + '...', fontSize) > maxWidth) {
      truncated = truncated.slice(0, -1)
    }
    return truncated + '...'
  }

  /** Horizontal rule. */
  drawHr(): void {
    this.ensureSpace(12)
    this.y -= 4
    this.currentPage.drawLine({
      start: { x: MARGIN.left, y: this.y },
      end: { x: MARGIN.left + CONTENT_WIDTH, y: this.y },
      thickness: 0.5,
      color: COLORS.DIVIDER,
    })
    this.y -= 8
  }

  /** Vertical spacer. */
  drawSpacer(height = 12): void {
    this.y -= height
    // If we've gone past the bottom margin, add a new page
    if (this.y < MARGIN.bottom) {
      this.drawFooter()
      this.addPage()
    }
  }

  /** Footer: "Tempo Platform - User Guide" on left, "Page X" on right. */
  drawFooter(): void {
    const footerY = MARGIN.bottom - 30

    // Left: branding
    const leftText = 'Tempo Platform  \u00B7  User Guide'
    this.currentPage.drawText(leftText, {
      x: MARGIN.left,
      y: footerY,
      size: FONT_SIZE.FOOTER,
      font: this.font,
      color: COLORS.MUTED,
    })

    // Right: page number
    const pageText = `Page ${this.pageNumber}`
    const pageWidth = this.measureText(pageText, FONT_SIZE.FOOTER)
    this.currentPage.drawText(pageText, {
      x: PAGE_WIDTH - MARGIN.right - pageWidth,
      y: footerY,
      size: FONT_SIZE.FOOTER,
      font: this.font,
      color: COLORS.MUTED,
    })

    // Top divider line above footer
    this.currentPage.drawLine({
      start: { x: MARGIN.left, y: footerY + 10 },
      end: { x: PAGE_WIDTH - MARGIN.right, y: footerY + 10 },
      thickness: 0.25,
      color: COLORS.DIVIDER,
    })
  }

  /** Finalize all pages and return the PDF bytes. */
  async build(): Promise<Uint8Array> {
    // Draw footer on the last page if it has content
    if (this.pageNumber > 0) {
      this.drawFooter()
    }
    return this.doc.save()
  }
}
