/**
 * Excel Import Handler
 *
 * Extends xlsx support for multi-sheet workbooks, header row detection,
 * data type inference, merged cell handling, and template downloads.
 */

import * as XLSX from 'xlsx'

// ============================================================
// Types
// ============================================================

export interface ExcelParseOptions {
  sheetIndex?: number
  sheetName?: string
  headerRow?: number // 0-based row index; null = auto-detect
  maxPreviewRows?: number
}

export interface ExcelSheetInfo {
  name: string
  index: number
  rowCount: number
  columnCount: number
  hasMergedCells: boolean
}

export interface ExcelParseResult {
  sheets: ExcelSheetInfo[]
  selectedSheet: string
  headers: string[]
  rows: Record<string, string>[]
  totalRows: number
  detectedHeaderRow: number
  columnTypes: Record<string, InferredType>
  errors: string[]
}

export type InferredType = 'text' | 'number' | 'currency' | 'date' | 'boolean' | 'email' | 'phone'

// ============================================================
// Sheet Inspection
// ============================================================

export function getWorkbookSheets(file: ArrayBuffer): ExcelSheetInfo[] {
  const wb = XLSX.read(file, { type: 'array' })

  return wb.SheetNames.map((name, index) => {
    const ws = wb.Sheets[name]
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
    const merges = ws['!merges'] || []

    return {
      name,
      index,
      rowCount: range.e.r - range.s.r + 1,
      columnCount: range.e.c - range.s.c + 1,
      hasMergedCells: merges.length > 0,
    }
  })
}

// ============================================================
// Header Row Detection
// ============================================================

const KNOWN_HEADERS = new Set([
  'name', 'full name', 'email', 'phone', 'department', 'title', 'job title',
  'hire date', 'start date', 'salary', 'country', 'location', 'level',
  'status', 'id', 'employee id', 'manager', 'type', 'currency',
  'date', 'amount', 'category', 'description', 'notes',
])

function scoreAsHeaderRow(row: (string | number | boolean | null | undefined)[]): number {
  let score = 0
  let nonEmpty = 0
  for (const cell of row) {
    if (cell == null || String(cell).trim() === '') continue
    nonEmpty++
    const val = String(cell).toLowerCase().trim()
    if (KNOWN_HEADERS.has(val)) score += 3
    else if (/^[a-z_\s]{2,40}$/i.test(val) && isNaN(Number(val))) score += 1
  }
  // Headers usually have most columns filled and are text
  if (nonEmpty >= row.length * 0.6) score += 2
  return score
}

export function detectHeaderRow(ws: XLSX.WorkSheet, maxScan = 10): number {
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
  let bestRow = 0
  let bestScore = -1

  const scanTo = Math.min(range.e.r, maxScan - 1)
  for (let r = range.s.r; r <= scanTo; r++) {
    const row: (string | null)[] = []
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c })
      const cell = ws[addr]
      row.push(cell ? String(cell.v) : null)
    }
    const s = scoreAsHeaderRow(row)
    if (s > bestScore) {
      bestScore = s
      bestRow = r
    }
  }

  return bestRow
}

// ============================================================
// Data Type Inference
// ============================================================

const DATE_PATTERN = /^\d{4}[-/]\d{1,2}[-/]\d{1,2}$|^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$/
const CURRENCY_PATTERN = /^[\$\u20AC\u00A3\u00A5]?\s*[\d,]+\.?\d*$|^[\d,]+\.?\d*\s*[\$\u20AC\u00A3\u00A5]$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_PATTERN = /^\+?[\d\s\-().]{7,20}$/
const BOOL_VALUES = new Set(['true', 'false', 'yes', 'no', '1', '0', 'y', 'n'])

export function inferColumnType(values: string[]): InferredType {
  const nonEmpty = values.filter(v => v.trim().length > 0)
  if (nonEmpty.length === 0) return 'text'

  const sample = nonEmpty.slice(0, 50) // sample first 50 non-empty values
  let dates = 0, currencies = 0, numbers = 0, booleans = 0, emails = 0, phones = 0

  for (const v of sample) {
    const trimmed = v.trim()
    if (DATE_PATTERN.test(trimmed)) dates++
    if (CURRENCY_PATTERN.test(trimmed.replace(/[,\s]/g, ''))) currencies++
    if (!isNaN(Number(trimmed.replace(/[,$%]/g, ''))) && trimmed.length > 0) numbers++
    if (BOOL_VALUES.has(trimmed.toLowerCase())) booleans++
    if (EMAIL_PATTERN.test(trimmed)) emails++
    if (PHONE_PATTERN.test(trimmed)) phones++
  }

  const threshold = sample.length * 0.7
  if (emails >= threshold) return 'email'
  if (dates >= threshold) return 'date'
  if (currencies >= threshold && trimmed_has_symbol(sample)) return 'currency'
  if (booleans >= threshold) return 'boolean'
  if (phones >= threshold) return 'phone'
  if (numbers >= threshold) return 'number'
  return 'text'
}

function trimmed_has_symbol(values: string[]): boolean {
  return values.some(v => /[\$\u20AC\u00A3\u00A5]/.test(v))
}

// ============================================================
// Merged Cell Resolution
// ============================================================

function resolveMergedCells(ws: XLSX.WorkSheet): void {
  const merges = ws['!merges'] || []
  for (const merge of merges) {
    const topLeft = XLSX.utils.encode_cell({ r: merge.s.r, c: merge.s.c })
    const value = ws[topLeft]
    if (!value) continue

    for (let r = merge.s.r; r <= merge.e.r; r++) {
      for (let c = merge.s.c; c <= merge.e.c; c++) {
        if (r === merge.s.r && c === merge.s.c) continue
        const addr = XLSX.utils.encode_cell({ r, c })
        ws[addr] = { ...value }
      }
    }
  }
}

// ============================================================
// Main Parser
// ============================================================

export function parseExcelFile(
  fileBuffer: ArrayBuffer,
  options: ExcelParseOptions = {}
): ExcelParseResult {
  const errors: string[] = []
  const wb = XLSX.read(fileBuffer, { type: 'array', cellDates: true })

  // Get sheet info
  const sheets = getWorkbookSheets(fileBuffer)

  if (sheets.length === 0) {
    return { sheets: [], selectedSheet: '', headers: [], rows: [], totalRows: 0, detectedHeaderRow: 0, columnTypes: {}, errors: ['Workbook contains no sheets'] }
  }

  // Select sheet
  let sheetName: string
  if (options.sheetName && wb.SheetNames.includes(options.sheetName)) {
    sheetName = options.sheetName
  } else if (options.sheetIndex != null && options.sheetIndex < wb.SheetNames.length) {
    sheetName = wb.SheetNames[options.sheetIndex]
  } else {
    sheetName = wb.SheetNames[0]
  }

  const ws = wb.Sheets[sheetName]
  if (!ws) {
    return { sheets, selectedSheet: sheetName, headers: [], rows: [], totalRows: 0, detectedHeaderRow: 0, columnTypes: {}, errors: ['Selected sheet not found'] }
  }

  // Resolve merged cells
  resolveMergedCells(ws)

  // Detect header row
  const headerRowIdx = options.headerRow ?? detectHeaderRow(ws)

  // Convert to array of arrays
  const aoa: (string | number | boolean | Date | null)[][] = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    raw: false,
    defval: '',
  })

  if (aoa.length <= headerRowIdx) {
    return { sheets, selectedSheet: sheetName, headers: [], rows: [], totalRows: 0, detectedHeaderRow: headerRowIdx, columnTypes: {}, errors: ['No data rows after header'] }
  }

  // Extract headers
  const rawHeaders = (aoa[headerRowIdx] || []).map(h => String(h ?? '').trim())
  const headers = rawHeaders.map((h, i) => h || `Column ${i + 1}`)

  // Extract data rows
  const maxRows = options.maxPreviewRows || Infinity
  const dataRows: Record<string, string>[] = []

  for (let i = headerRowIdx + 1; i < aoa.length && dataRows.length < maxRows; i++) {
    const rowArr = aoa[i]
    if (!rowArr || rowArr.every(cell => !cell || String(cell).trim() === '')) continue

    const row: Record<string, string> = {}
    headers.forEach((header, colIdx) => {
      const val = rowArr[colIdx]
      if (val instanceof Date) {
        row[header] = val.toISOString().split('T')[0]
      } else {
        row[header] = val != null ? String(val).trim() : ''
      }
    })
    dataRows.push(row)
  }

  // Infer column types
  const columnTypes: Record<string, InferredType> = {}
  for (const header of headers) {
    const values = dataRows.map(r => r[header] || '')
    columnTypes[header] = inferColumnType(values)
  }

  return {
    sheets,
    selectedSheet: sheetName,
    headers,
    rows: dataRows,
    totalRows: aoa.length - headerRowIdx - 1,
    detectedHeaderRow: headerRowIdx,
    columnTypes,
    errors,
  }
}

// ============================================================
// Read File as ArrayBuffer
// ============================================================

export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}

// ============================================================
// Template Generation & Download
// ============================================================

export function downloadExcelTemplate(
  templateName: string,
  headers: string[],
  sampleRows: string[][],
  entityLabel: string
): void {
  const wb = XLSX.utils.book_new()
  const sheetData = [headers, ...sampleRows]
  const ws = XLSX.utils.aoa_to_sheet(sheetData)

  // Auto-width columns
  ws['!cols'] = headers.map((header, colIdx) => {
    let maxLen = header.length
    for (const row of sampleRows) {
      const cellLen = (row[colIdx] || '').length
      if (cellLen > maxLen) maxLen = cellLen
    }
    return { wch: Math.min(maxLen + 4, 50) }
  })

  XLSX.utils.book_append_sheet(wb, ws, entityLabel)
  XLSX.writeFile(wb, `${templateName}.xlsx`)
}

// ============================================================
// JSON File Parser
// ============================================================

export function parseJSONFile(text: string): { headers: string[]; rows: Record<string, string>[]; errors: string[] } {
  const errors: string[] = []
  try {
    const data = JSON.parse(text)
    const arr = Array.isArray(data) ? data : data.data ? data.data : [data]

    if (arr.length === 0) {
      return { headers: [], rows: [], errors: ['JSON file is empty or contains no records'] }
    }

    // Flatten one level of nesting
    const flatRows = arr.map((item: Record<string, unknown>) => {
      const flat: Record<string, string> = {}
      for (const [key, val] of Object.entries(item)) {
        if (val != null && typeof val === 'object' && !Array.isArray(val)) {
          for (const [subKey, subVal] of Object.entries(val as Record<string, unknown>)) {
            flat[`${key}.${subKey}`] = subVal != null ? String(subVal) : ''
          }
        } else {
          flat[key] = val != null ? String(val) : ''
        }
      }
      return flat
    })

    // Collect all unique headers
    const headerSet = new Set<string>()
    for (const row of flatRows) {
      for (const key of Object.keys(row)) {
        headerSet.add(key)
      }
    }
    const headers = Array.from(headerSet)

    return { headers, rows: flatRows, errors }
  } catch (err) {
    return { headers: [], rows: [], errors: [`Invalid JSON: ${err instanceof Error ? err.message : 'Parse error'}`] }
  }
}
