import { rgb } from 'pdf-lib'

// ─── Page Dimensions ────────────────────────────────────────────────────────
// US Letter: 8.5" x 11" at 72 DPI

export const PAGE_WIDTH = 612
export const PAGE_HEIGHT = 792

export const MARGIN = {
  top: 60,
  right: 50,
  bottom: 60,
  left: 50,
} as const

export const CONTENT_WIDTH = PAGE_WIDTH - MARGIN.left - MARGIN.right // 512

// ─── Brand Colors ───────────────────────────────────────────────────────────
// All colors expressed as pdf-lib rgb() values (0-1 range).

export const COLORS = {
  /** Primary text and headings — dark navy #212638 */
  PRIMARY: rgb(0.13, 0.15, 0.22),
  /** Accent elements, rules, highlights — Tempo orange #ea580c */
  ACCENT: rgb(0.918, 0.345, 0.047),
  /** Secondary / muted text — grey #737580 */
  MUTED: rgb(0.451, 0.459, 0.502),
  /** Light background fills — #f5f5f5 */
  LIGHT_BG: rgb(0.961, 0.961, 0.961),
  /** Divider lines and borders — #d1d5db */
  DIVIDER: rgb(0.82, 0.835, 0.859),
  /** Tip box background — orange-50 #fff7ed */
  TIP_BG: rgb(1.0, 0.969, 0.929),
  /** White */
  WHITE: rgb(1, 1, 1),
} as const

// ─── Font Sizes ─────────────────────────────────────────────────────────────

export const FONT_SIZE = {
  TITLE: 24,
  H1: 18,
  H2: 14,
  H3: 12,
  BODY: 10,
  SMALL: 8,
  FOOTER: 7,
} as const

// ─── Line Heights ───────────────────────────────────────────────────────────
// Multiplied from font size to give comfortable reading rhythm.

export const LINE_HEIGHT: Record<keyof typeof FONT_SIZE, number> = {
  TITLE: 32,
  H1: 26,
  H2: 20,
  H3: 18,
  BODY: 15,
  SMALL: 12,
  FOOTER: 10,
} as const
