import type { ModuleDoc } from '../types'
import type { DocPdfBuilder } from './doc-pdf-builder'
import {
  PAGE_WIDTH,
  PAGE_HEIGHT,
  MARGIN,
  CONTENT_WIDTH,
  COLORS,
  FONT_SIZE,
} from './constants'
import { DOC_GROUP_LABELS } from '../types'

// ─── Cover Page ─────────────────────────────────────────────────────────────
// Generates a professional cover page for a module's user guide PDF. Layout:
//
//   ┌──────────────────────────────────┐
//   │  ██████████████████████████████  │  <- Tempo orange banner (120px)
//   │  ██       T E M P O        ██  │
//   │  ██████████████████████████████  │
//   │                                  │
//   │         Module Title             │  <- 24pt bold, centered
//   │         Module Subtitle          │  <- 12pt muted, centered
//   │                                  │
//   │        ─── ◆ ───                 │  <- Decorative divider
//   │                                  │
//   │         User Guide               │  <- 14pt, centered
//   │       Version 1.0                │  <- 10pt muted
//   │    Last Updated: 2026-03-13      │  <- 10pt muted
//   │       Category: Core             │  <- 10pt muted
//   │                                  │
//   │                                  │
//   │       CONFIDENTIAL               │  <- 8pt muted, bottom
//   └──────────────────────────────────┘

export function drawCoverPage(builder: DocPdfBuilder, moduleDoc: ModuleDoc): void {
  builder.addPage()
  const page = builder.getPage()

  // ── Tempo orange banner ───────────────────────────────────────────────
  const bannerHeight = 120
  const bannerY = PAGE_HEIGHT - bannerHeight

  page.drawRectangle({
    x: 0,
    y: bannerY,
    width: PAGE_WIDTH,
    height: bannerHeight,
    color: COLORS.ACCENT,
  })

  // "TEMPO" text centered inside the banner
  // We need the bold font from the builder. Since we use drawText on the page
  // directly, we pass font through the page API. The builder exposes getPage().
  // We'll draw using page.drawText with explicit positioning.
  const tempoText = 'T E M P O'
  // Approximate width: 9 chars * ~14px at size 28 = ~126px. Center it.
  const tempoSize = 28
  // Center horizontally — estimate character width for Helvetica Bold
  const tempoApproxWidth = tempoText.length * tempoSize * 0.42
  const tempoX = (PAGE_WIDTH - tempoApproxWidth) / 2

  page.drawText(tempoText, {
    x: tempoX,
    y: bannerY + (bannerHeight - tempoSize) / 2,
    size: tempoSize,
    color: COLORS.WHITE,
  })

  // ── Module title ──────────────────────────────────────────────────────
  let y = bannerY - 70

  const titleSize = FONT_SIZE.TITLE
  const titleApproxWidth = moduleDoc.title.length * titleSize * 0.38
  const titleX = Math.max(MARGIN.left, (PAGE_WIDTH - titleApproxWidth) / 2)

  page.drawText(moduleDoc.title, {
    x: titleX,
    y,
    size: titleSize,
    color: COLORS.PRIMARY,
  })

  // ── Subtitle ──────────────────────────────────────────────────────────
  y -= 28

  // Word wrap subtitle to fit within content area
  const subtitleSize = 11
  const subtitleLines = wrapCentered(moduleDoc.subtitle, subtitleSize, CONTENT_WIDTH)

  for (const line of subtitleLines) {
    const lineApproxWidth = line.length * subtitleSize * 0.36
    const lineX = Math.max(MARGIN.left, (PAGE_WIDTH - lineApproxWidth) / 2)
    page.drawText(line, {
      x: lineX,
      y,
      size: subtitleSize,
      color: COLORS.MUTED,
    })
    y -= 18
  }

  // ── Decorative divider ────────────────────────────────────────────────
  y -= 12
  const dividerWidth = 80
  const dividerX = (PAGE_WIDTH - dividerWidth) / 2

  page.drawLine({
    start: { x: dividerX, y },
    end: { x: dividerX + dividerWidth, y },
    thickness: 0.75,
    color: COLORS.ACCENT,
  })

  // Diamond accent in center — draw as a small filled circle
  const diamondX = PAGE_WIDTH / 2
  page.drawCircle({
    x: diamondX,
    y,
    size: 3,
    color: COLORS.ACCENT,
  })

  // ── User Guide label ──────────────────────────────────────────────────
  y -= 40
  const guideText = 'User Guide'
  const guideSize = FONT_SIZE.H2
  const guideApproxWidth = guideText.length * guideSize * 0.38
  const guideX = (PAGE_WIDTH - guideApproxWidth) / 2

  page.drawText(guideText, {
    x: guideX,
    y,
    size: guideSize,
    color: COLORS.PRIMARY,
  })

  // ── Metadata block ────────────────────────────────────────────────────
  y -= 34
  const metaSize = FONT_SIZE.BODY
  const metaLines = [
    `Version ${moduleDoc.version}`,
    `Last Updated: ${formatDate(moduleDoc.lastUpdated)}`,
    `Category: ${DOC_GROUP_LABELS[moduleDoc.group] ?? moduleDoc.group}`,
  ]

  for (const line of metaLines) {
    const lineApproxWidth = line.length * metaSize * 0.36
    const lineX = (PAGE_WIDTH - lineApproxWidth) / 2
    page.drawText(line, {
      x: lineX,
      y,
      size: metaSize,
      color: COLORS.MUTED,
    })
    y -= 18
  }

  // ── Confidential footer ───────────────────────────────────────────────
  const confText = 'CONFIDENTIAL  \u2014  For authorized personnel only'
  const confSize = FONT_SIZE.SMALL
  const confApproxWidth = confText.length * confSize * 0.34
  const confX = (PAGE_WIDTH - confApproxWidth) / 2

  page.drawText(confText, {
    x: confX,
    y: MARGIN.bottom,
    size: confSize,
    color: COLORS.MUTED,
  })

  // ── Bottom accent stripe ──────────────────────────────────────────────
  page.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: 4,
    color: COLORS.ACCENT,
  })

  // Update builder y to bottom (cover page is a standalone page)
  builder.setY(MARGIN.bottom)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function wrapCentered(text: string, fontSize: number, maxWidth: number): string[] {
  const avgCharWidth = fontSize * 0.36
  const maxChars = Math.floor(maxWidth / avgCharWidth)
  const words = text.split(/\s+/)
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    if (!currentLine) {
      currentLine = word
      continue
    }
    if ((currentLine + ' ' + word).length <= maxChars) {
      currentLine += ' ' + word
    } else {
      lines.push(currentLine)
      currentLine = word
    }
  }
  if (currentLine) lines.push(currentLine)
  return lines.length > 0 ? lines : ['']
}

function formatDate(isoDate: string): string {
  try {
    const d = new Date(isoDate + 'T00:00:00')
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return isoDate
  }
}
