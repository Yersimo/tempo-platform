'use client'

import { useState, useCallback, useRef } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select } from '@/components/ui/input'
import {
  Upload, FileSpreadsheet, FileText, FileJson, ClipboardPaste,
  ChevronRight, ChevronLeft, CheckCircle, XCircle, AlertTriangle,
  Download, Loader2, ArrowRight, RotateCcw, CircleDot, Columns3,
  Globe, Users, Building2, Layers, DollarSign,
} from 'lucide-react'
import { parseCSV, mapCSVToEmployeeFields } from '@/lib/export-import'
import { parseExcelFile, readFileAsArrayBuffer, parseJSONFile } from '@/lib/import/excel-handler'
import { IMPORT_TEMPLATES, generateTemplateCSV, getAvailableTemplates } from '@/lib/import/templates'
import { addImportRecord, type ImportRecord } from '@/lib/import/import-history'
import { downloadExcelTemplate } from '@/lib/import/excel-handler'
import { cn } from '@/lib/utils/cn'

// ============================================================
// Types
// ============================================================

type WizardStep = 'source' | 'preview' | 'validate' | 'import'
type ImportSource = 'file' | 'paste' | 'connector'
type FileFormat = 'csv' | 'xlsx' | 'json'

interface ColumnMapping {
  sourceColumn: string
  targetField: string
  confidence: 'auto' | 'suggested' | 'manual' | 'unmapped'
}

interface ValidationResult {
  rowIndex: number
  status: 'valid' | 'error' | 'warning'
  errors: string[]
  warnings: string[]
}

interface ImportWizardProps {
  open: boolean
  onClose: () => void
  entityType?: string
  orgId?: string
  onImportComplete?: (record: ImportRecord) => void
}

const CONNECTOR_OPTIONS = [
  { id: 'bamboohr', name: 'BambooHR', icon: <Users size={18} /> },
  { id: 'gusto', name: 'Gusto', icon: <DollarSign size={18} /> },
  { id: 'deel', name: 'Deel', icon: <Globe size={18} /> },
  { id: 'rippling', name: 'Rippling', icon: <Layers size={18} /> },
  { id: 'workday', name: 'Workday', icon: <Building2 size={18} /> },
  { id: 'sap', name: 'SAP SuccessFactors', icon: <Building2 size={18} /> },
]

const STEPS: { key: WizardStep; label: string }[] = [
  { key: 'source', label: 'Choose Source' },
  { key: 'preview', label: 'Map Fields' },
  { key: 'validate', label: 'Validate' },
  { key: 'import', label: 'Import' },
]

// ============================================================
// Field mapping helpers (reuse aliases from export-import.ts)
// ============================================================

function autoMapColumns(
  sourceHeaders: string[],
  targetFields: string[]
): ColumnMapping[] {
  const existingMapping = mapCSVToEmployeeFields(sourceHeaders)
  const usedTargets = new Set<string>()

  const mappings: ColumnMapping[] = sourceHeaders.map(header => {
    // Check if mapCSVToEmployeeFields found a match
    for (const [targetField, sourceHeader] of Object.entries(existingMapping)) {
      if (sourceHeader === header && !usedTargets.has(targetField) && targetFields.includes(targetField)) {
        usedTargets.add(targetField)
        return { sourceColumn: header, targetField, confidence: 'auto' as const }
      }
    }

    // Fuzzy match: normalize and compare
    const normalized = header.toLowerCase().replace(/[\s_-]+/g, '_').trim()
    for (const field of targetFields) {
      if (usedTargets.has(field)) continue
      const normalizedField = field.toLowerCase().replace(/[\s_-]+/g, '_').trim()
      if (normalized === normalizedField) {
        usedTargets.add(field)
        return { sourceColumn: header, targetField: field, confidence: 'suggested' as const }
      }
    }

    return { sourceColumn: header, targetField: '', confidence: 'unmapped' as const }
  })

  return mappings
}

// ============================================================
// Component
// ============================================================

export function ImportWizard({ open, onClose, entityType: initialEntityType, orgId = '', onImportComplete }: ImportWizardProps) {
  const [step, setStep] = useState<WizardStep>('source')
  const [importSource, setImportSource] = useState<ImportSource>('file')
  const [selectedConnector, setSelectedConnector] = useState<string>('')
  const [entityType, setEntityType] = useState(initialEntityType || 'employees')

  // File data
  const [fileName, setFileName] = useState('')
  const [fileFormat, setFileFormat] = useState<FileFormat>('csv')
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<Record<string, string>[]>([])
  const [totalRows, setTotalRows] = useState(0)
  const [pasteText, setPasteText] = useState('')

  // Excel-specific
  const [excelSheets, setExcelSheets] = useState<{ name: string; index: number }[]>([])
  const [selectedSheet, setSelectedSheet] = useState(0)
  const [excelBuffer, setExcelBuffer] = useState<ArrayBuffer | null>(null)

  // Mapping
  const [mappings, setMappings] = useState<ColumnMapping[]>([])

  // Validation
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([])
  const [isValidating, setIsValidating] = useState(false)

  // Import
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importResult, setImportResult] = useState<ImportRecord | null>(null)
  const [importErrors, setImportErrors] = useState<{ row: number; message: string }[]>([])

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Helpers ──────────────────────────────────────────────

  const template = IMPORT_TEMPLATES[entityType]
  const targetFields = template?.headers || []

  const reset = useCallback(() => {
    setStep('source')
    setImportSource('file')
    setSelectedConnector('')
    setFileName('')
    setHeaders([])
    setRows([])
    setTotalRows(0)
    setPasteText('')
    setExcelSheets([])
    setSelectedSheet(0)
    setExcelBuffer(null)
    setMappings([])
    setValidationResults([])
    setIsValidating(false)
    setIsImporting(false)
    setImportProgress(0)
    setImportResult(null)
    setImportErrors([])
  }, [])

  const handleClose = useCallback(() => {
    reset()
    onClose()
  }, [reset, onClose])

  // ── File Handling ──────────────────────────────────────────

  const handleFileSelect = useCallback(async (file: File) => {
    setFileName(file.name)
    const ext = file.name.split('.').pop()?.toLowerCase() || ''

    if (ext === 'xlsx' || ext === 'xls') {
      setFileFormat('xlsx')
      const buffer = await readFileAsArrayBuffer(file)
      setExcelBuffer(buffer)
      const result = parseExcelFile(buffer)
      setExcelSheets(result.sheets.map(s => ({ name: s.name, index: s.index })))
      setSelectedSheet(0)
      setHeaders(result.headers)
      setRows(result.rows.slice(0, 100))
      setTotalRows(result.totalRows)
    } else if (ext === 'json') {
      setFileFormat('json')
      const text = await file.text()
      const result = parseJSONFile(text)
      setHeaders(result.headers)
      setRows(result.rows.slice(0, 100))
      setTotalRows(result.rows.length)
    } else {
      setFileFormat('csv')
      const text = await file.text()
      const result = parseCSV(text)
      setHeaders(result.headers)
      setRows(result.rows.slice(0, 100))
      setTotalRows(result.totalRows)
    }
  }, [])

  const handleSheetChange = useCallback((sheetIndex: number) => {
    if (!excelBuffer) return
    setSelectedSheet(sheetIndex)
    const result = parseExcelFile(excelBuffer, { sheetIndex })
    setHeaders(result.headers)
    setRows(result.rows.slice(0, 100))
    setTotalRows(result.totalRows)
  }, [excelBuffer])

  const handlePaste = useCallback(() => {
    if (!pasteText.trim()) return
    const result = parseCSV(pasteText)
    setHeaders(result.headers)
    setRows(result.rows.slice(0, 100))
    setTotalRows(result.totalRows)
    setFileFormat('csv')
    setFileName('pasted-data')
  }, [pasteText])

  // ── Step Navigation ──────────────────────────────────────

  const goToPreview = useCallback(() => {
    if (headers.length === 0) return
    const autoMapped = autoMapColumns(headers, targetFields)
    setMappings(autoMapped)
    setStep('preview')
  }, [headers, targetFields])

  const goToValidate = useCallback(() => {
    setIsValidating(true)
    setStep('validate')

    // Run validation
    const results: ValidationResult[] = rows.map((row, idx) => {
      const errors: string[] = []
      const warnings: string[] = []

      // Check required fields
      const tpl = IMPORT_TEMPLATES[entityType]
      if (tpl) {
        for (const reqField of tpl.requiredFields) {
          const mapping = mappings.find(m => m.targetField === reqField)
          if (!mapping || !mapping.sourceColumn) {
            errors.push(`Required field "${reqField}" is not mapped`)
          } else {
            const val = row[mapping.sourceColumn]
            if (!val || val.trim() === '') {
              errors.push(`Required field "${reqField}" is empty`)
            }
          }
        }
      }

      // Check email format
      const emailMapping = mappings.find(m => m.targetField === 'email')
      if (emailMapping?.sourceColumn) {
        const email = row[emailMapping.sourceColumn]
        if (email && !email.includes('@')) {
          errors.push(`Invalid email: ${email}`)
        }
      }

      // Check date format
      for (const m of mappings) {
        if (tpl?.fieldTypes[m.targetField] === 'date' && m.sourceColumn) {
          const val = row[m.sourceColumn]
          if (val && !/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(val)) {
            warnings.push(`Field "${m.targetField}" may have an invalid date format: ${val}`)
          }
        }
      }

      return {
        rowIndex: idx,
        status: errors.length > 0 ? 'error' as const : warnings.length > 0 ? 'warning' as const : 'valid' as const,
        errors,
        warnings,
      }
    })

    setValidationResults(results)
    setIsValidating(false)
  }, [rows, mappings, entityType])

  const runImport = useCallback(async () => {
    setIsImporting(true)
    setImportProgress(0)
    setImportErrors([])

    const validRows = validationResults.filter(r => r.status !== 'error')
    const errorRowCount = validationResults.filter(r => r.status === 'error').length
    const importedIds: string[] = []
    const errors: { row: number; message: string }[] = []

    // Simulate import progress
    for (let i = 0; i < validRows.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 15))
      importedIds.push(crypto.randomUUID())
      setImportProgress(Math.round(((i + 1) / validRows.length) * 100))
    }

    // Add any rows that had validation errors
    for (const vr of validationResults) {
      if (vr.status === 'error') {
        errors.push({ row: vr.rowIndex + 2, message: vr.errors.join('; ') })
      }
    }

    setImportErrors(errors)

    const sourceLabel = importSource === 'connector' ? selectedConnector : fileFormat
    const record = addImportRecord({
      orgId,
      entityType,
      source: sourceLabel,
      fileName: fileName || undefined,
      totalRows: totalRows,
      importedRows: validRows.length,
      errorRows: errorRowCount,
      importedIds,
      status: errorRowCount === 0 ? 'completed' : validRows.length > 0 ? 'partial' : 'failed',
      importedBy: orgId,
      errors: errors.map(e => ({ row: e.row, field: '', message: e.message })),
    })

    setImportResult(record)
    setIsImporting(false)
    onImportComplete?.(record)
  }, [validationResults, importSource, selectedConnector, fileFormat, orgId, entityType, fileName, totalRows, onImportComplete])

  // ── Render Helpers ──────────────────────────────────────

  const confidenceBadge = (confidence: ColumnMapping['confidence']) => {
    switch (confidence) {
      case 'auto': return <Badge variant="success">Auto-matched</Badge>
      case 'suggested': return <Badge variant="warning">Suggested</Badge>
      case 'manual': return <Badge variant="info">Manual</Badge>
      case 'unmapped': return <Badge variant="error">Unmapped</Badge>
    }
  }

  const stepIndex = STEPS.findIndex(s => s.key === step)

  // ── Step: Source ──────────────────────────────────────────

  const renderSourceStep = () => (
    <div className="space-y-6">
      {/* Entity Type Selector */}
      <Select
        label="What are you importing?"
        value={entityType}
        onChange={(e) => setEntityType(e.target.value)}
        options={getAvailableTemplates().map(t => ({ value: t.key, label: t.name, description: t.description }))}
      />

      {/* Source Tabs */}
      <div className="flex gap-2 border-b border-divider pb-2">
        {([
          { key: 'file', label: 'Upload File', icon: <Upload size={14} /> },
          { key: 'paste', label: 'Paste Data', icon: <ClipboardPaste size={14} /> },
          { key: 'connector', label: 'Connect Service', icon: <Globe size={14} /> },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setImportSource(tab.key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors',
              importSource === tab.key
                ? 'bg-tempo-50 text-tempo-700 border border-tempo-200'
                : 'text-t3 hover:text-t1 hover:bg-canvas'
            )}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* File Upload */}
      {importSource === 'file' && (
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileSelect(file)
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-tempo-300 hover:bg-tempo-50/30 transition-colors group"
          >
            <Upload size={28} className="mx-auto mb-3 text-t3 group-hover:text-tempo-600" />
            <p className="text-sm font-medium text-t1">Click to upload or drag and drop</p>
            <p className="text-xs text-t3 mt-1">CSV, XLSX, or JSON files accepted</p>
          </button>

          {fileName && (
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-200">
              {fileFormat === 'xlsx' ? <FileSpreadsheet size={18} className="text-green-600" /> :
               fileFormat === 'json' ? <FileJson size={18} className="text-green-600" /> :
               <FileText size={18} className="text-green-600" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-800 truncate">{fileName}</p>
                <p className="text-xs text-green-600">{totalRows} rows detected, {headers.length} columns</p>
              </div>
              <Badge variant="success">{fileFormat.toUpperCase()}</Badge>
            </div>
          )}

          {fileFormat === 'xlsx' && excelSheets.length > 1 && (
            <Select
              label="Select Sheet"
              value={String(selectedSheet)}
              onChange={(e) => handleSheetChange(Number(e.target.value))}
              options={excelSheets.map(s => ({ value: String(s.index), label: s.name }))}
            />
          )}

          {/* Template Download */}
          <div className="flex items-center justify-between p-3 bg-canvas rounded-xl">
            <div>
              <p className="text-xs font-medium text-t2">Need a template?</p>
              <p className="text-[0.65rem] text-t3">Download a pre-formatted template for {IMPORT_TEMPLATES[entityType]?.name || entityType}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const csv = generateTemplateCSV(entityType)
                  if (csv) {
                    const blob = new Blob([csv], { type: 'text/csv' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `${entityType}-template.csv`
                    a.click()
                    URL.revokeObjectURL(url)
                  }
                }}
              >
                <FileText size={12} /> CSV
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const tpl = IMPORT_TEMPLATES[entityType]
                  if (tpl) downloadExcelTemplate(`${entityType}-template`, tpl.headers, tpl.sampleRows, tpl.name)
                }}
              >
                <FileSpreadsheet size={12} /> XLSX
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Paste Data */}
      {importSource === 'paste' && (
        <div className="space-y-3">
          <p className="text-xs text-t3">Paste CSV or tab-separated data below. First row should be headers.</p>
          <textarea
            className="w-full h-40 px-3 py-2 text-xs font-mono bg-white border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-tempo-500/20 focus:border-tempo-500"
            placeholder={'full_name,email,job_title,department\nJane Smith,jane@company.com,Engineer,Engineering'}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
          />
          <Button variant="secondary" size="sm" onClick={handlePaste} disabled={!pasteText.trim()}>
            <ClipboardPaste size={14} /> Parse Data
          </Button>
          {headers.length > 0 && (
            <p className="text-xs text-green-600">Parsed {totalRows} rows with {headers.length} columns</p>
          )}
        </div>
      )}

      {/* Connector */}
      {importSource === 'connector' && (
        <div className="grid grid-cols-2 gap-3">
          {CONNECTOR_OPTIONS.map(conn => (
            <button
              key={conn.id}
              onClick={() => setSelectedConnector(conn.id)}
              className={cn(
                'flex items-center gap-3 p-4 rounded-xl border transition-all text-left',
                selectedConnector === conn.id
                  ? 'border-tempo-500 bg-tempo-50 ring-2 ring-tempo-500/20'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              )}
            >
              <div className="shrink-0 w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-t2">
                {conn.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-t1">{conn.name}</p>
                <p className="text-[0.65rem] text-t3">Configure API key to import</p>
              </div>
            </button>
          ))}
        </div>
      )}
      {importSource === 'connector' && selectedConnector && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">Configure API Key</p>
              <p className="text-xs text-amber-700 mt-1">
                To import from {CONNECTOR_OPTIONS.find(c => c.id === selectedConnector)?.name}, configure your API credentials in Settings &rarr; Integrations first.
                Once connected, data will be synced and appear as importable rows.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // ── Step: Preview & Map ──────────────────────────────────

  const renderPreviewStep = () => {
    const previewRows = rows.slice(0, 5)

    return (
      <div className="space-y-6">
        {/* Data Preview */}
        <div>
          <h3 className="text-xs font-semibold text-t1 mb-2 flex items-center gap-1.5">
            <Columns3 size={14} /> Data Preview (first 5 rows)
          </h3>
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-canvas border-b border-gray-200">
                    <th className="px-3 py-2 text-left font-medium text-t3 w-8">#</th>
                    {headers.slice(0, 8).map(h => (
                      <th key={h} className="px-3 py-2 text-left font-medium text-t2 whitespace-nowrap">{h}</th>
                    ))}
                    {headers.length > 8 && (
                      <th className="px-3 py-2 text-left font-medium text-t3">+{headers.length - 8} more</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, idx) => (
                    <tr key={idx} className="border-b border-gray-100 last:border-0">
                      <td className="px-3 py-2 text-t3">{idx + 1}</td>
                      {headers.slice(0, 8).map(h => (
                        <td key={h} className="px-3 py-2 text-t1 max-w-[150px] truncate">{row[h] || ''}</td>
                      ))}
                      {headers.length > 8 && <td className="px-3 py-2 text-t3">...</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Column Mapping */}
        <div>
          <h3 className="text-xs font-semibold text-t1 mb-2">Column Mapping</h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {mappings.map((mapping, idx) => (
              <div key={idx} className="flex items-center gap-3 p-2.5 bg-canvas rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-t1 truncate">{mapping.sourceColumn}</p>
                  <p className="text-[0.6rem] text-t3 truncate">Sample: {rows[0]?.[mapping.sourceColumn] || 'N/A'}</p>
                </div>
                <ArrowRight size={14} className="text-t3 shrink-0" />
                <div className="w-[180px] shrink-0">
                  <select
                    className="w-full h-8 px-2 text-xs bg-white border border-gray-200 rounded-lg text-t1 focus:outline-none focus:ring-2 focus:ring-tempo-500/20 focus:border-tempo-500"
                    value={mapping.targetField}
                    onChange={(e) => {
                      const updated = [...mappings]
                      updated[idx] = {
                        ...mapping,
                        targetField: e.target.value,
                        confidence: e.target.value ? 'manual' : 'unmapped',
                      }
                      setMappings(updated)
                    }}
                  >
                    <option value="">-- Skip this column --</option>
                    {targetFields.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div className="w-[90px] shrink-0">{confidenceBadge(mapping.confidence)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Mapping Summary */}
        <div className="flex items-center gap-4 text-xs">
          <span className="text-green-600 flex items-center gap-1">
            <CircleDot size={10} /> {mappings.filter(m => m.confidence === 'auto').length} auto-matched
          </span>
          <span className="text-amber-600 flex items-center gap-1">
            <CircleDot size={10} /> {mappings.filter(m => m.confidence === 'suggested').length} suggested
          </span>
          <span className="text-red-500 flex items-center gap-1">
            <CircleDot size={10} /> {mappings.filter(m => m.confidence === 'unmapped').length} unmapped
          </span>
        </div>
      </div>
    )
  }

  // ── Step: Validate ──────────────────────────────────────

  const renderValidateStep = () => {
    const validCount = validationResults.filter(r => r.status === 'valid').length
    const warningCount = validationResults.filter(r => r.status === 'warning').length
    const errorCount = validationResults.filter(r => r.status === 'error').length

    if (isValidating) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 size={28} className="animate-spin text-tempo-600 mb-3" />
          <p className="text-sm text-t2">Validating {totalRows} rows...</p>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center">
            <CheckCircle size={20} className="mx-auto mb-1 text-green-600" />
            <p className="text-lg font-bold text-green-700">{validCount}</p>
            <p className="text-xs text-green-600">Ready to import</p>
          </div>
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
            <AlertTriangle size={20} className="mx-auto mb-1 text-amber-600" />
            <p className="text-lg font-bold text-amber-700">{warningCount}</p>
            <p className="text-xs text-amber-600">Warnings</p>
          </div>
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center">
            <XCircle size={20} className="mx-auto mb-1 text-red-600" />
            <p className="text-lg font-bold text-red-700">{errorCount}</p>
            <p className="text-xs text-red-600">Will be skipped</p>
          </div>
        </div>

        {/* Error Details */}
        {errorCount > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-t1 mb-2">Errors ({errorCount})</h3>
            <div className="space-y-1 max-h-[200px] overflow-y-auto">
              {validationResults
                .filter(r => r.status === 'error')
                .slice(0, 20)
                .map((r) => (
                  <div key={r.rowIndex} className="flex items-start gap-2 p-2 bg-red-50 rounded-lg text-xs">
                    <XCircle size={12} className="text-red-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-medium text-red-700">Row {r.rowIndex + 2}:</span>{' '}
                      <span className="text-red-600">{r.errors.join('; ')}</span>
                    </div>
                  </div>
                ))}
              {errorCount > 20 && (
                <p className="text-xs text-t3 text-center py-1">...and {errorCount - 20} more errors</p>
              )}
            </div>
          </div>
        )}

        {/* Warnings */}
        {warningCount > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-t1 mb-2">Warnings ({warningCount})</h3>
            <div className="space-y-1 max-h-[150px] overflow-y-auto">
              {validationResults
                .filter(r => r.status === 'warning')
                .slice(0, 10)
                .map((r) => (
                  <div key={r.rowIndex} className="flex items-start gap-2 p-2 bg-amber-50 rounded-lg text-xs">
                    <AlertTriangle size={12} className="text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-medium text-amber-700">Row {r.rowIndex + 2}:</span>{' '}
                      <span className="text-amber-600">{r.warnings.join('; ')}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Step: Import ──────────────────────────────────────────

  const renderImportStep = () => {
    if (isImporting) {
      const validCount = validationResults.filter(r => r.status !== 'error').length
      const imported = Math.round((importProgress / 100) * validCount)
      return (
        <div className="space-y-6 py-4">
          <div className="text-center">
            <Loader2 size={28} className="animate-spin text-tempo-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-t1">Importing records...</p>
            <p className="text-xs text-t3 mt-1">{imported} of {validCount} rows processed</p>
          </div>
          <Progress value={importProgress} size="md" color="orange" showLabel />
        </div>
      )
    }

    if (importResult) {
      const isSuccess = importResult.status === 'completed'
      return (
        <div className="space-y-6 py-4">
          <div className="text-center">
            {isSuccess ? (
              <CheckCircle size={40} className="mx-auto mb-3 text-green-500" />
            ) : (
              <AlertTriangle size={40} className="mx-auto mb-3 text-amber-500" />
            )}
            <h3 className="text-base font-semibold text-t1">
              {isSuccess ? 'Import Complete!' : 'Import Completed with Errors'}
            </h3>
            <p className="text-sm text-t3 mt-1">
              {importResult.importedRows} of {importResult.totalRows} records imported successfully
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-canvas rounded-xl text-center">
              <p className="text-lg font-bold text-t1">{importResult.totalRows}</p>
              <p className="text-[0.65rem] text-t3">Total Rows</p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl text-center">
              <p className="text-lg font-bold text-green-700">{importResult.importedRows}</p>
              <p className="text-[0.65rem] text-green-600">Imported</p>
            </div>
            <div className="p-3 bg-red-50 rounded-xl text-center">
              <p className="text-lg font-bold text-red-700">{importResult.errorRows}</p>
              <p className="text-[0.65rem] text-red-600">Errors</p>
            </div>
          </div>

          {importErrors.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-t1 mb-2">Failed Rows</h4>
              <div className="space-y-1 max-h-[150px] overflow-y-auto">
                {importErrors.slice(0, 10).map((err, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-2 bg-red-50 rounded-lg text-xs">
                    <XCircle size={12} className="text-red-500 mt-0.5 shrink-0" />
                    <span className="text-red-600">Row {err.row}: {err.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-center">
            <Button variant="secondary" size="sm" onClick={() => { reset(); setStep('source') }}>
              <RotateCcw size={14} /> Import More
            </Button>
            <Button variant="primary" size="sm" onClick={handleClose}>
              Done
            </Button>
          </div>
        </div>
      )
    }

    return null
  }

  // ── Main Render ──────────────────────────────────────────

  const canProceed = () => {
    switch (step) {
      case 'source':
        if (importSource === 'connector') return !!selectedConnector
        return headers.length > 0
      case 'preview':
        return mappings.some(m => m.targetField)
      case 'validate':
        return validationResults.some(r => r.status !== 'error')
      default:
        return false
    }
  }

  const handleNext = () => {
    switch (step) {
      case 'source': goToPreview(); break
      case 'preview': goToValidate(); break
      case 'validate': runImport(); break
    }
  }

  const handleBack = () => {
    switch (step) {
      case 'preview': setStep('source'); break
      case 'validate': setStep('preview'); break
      case 'import': setStep('validate'); break
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Import Data" size="xl">
      {/* Step Indicator */}
      <div className="flex items-center gap-1 mb-6">
        {STEPS.map((s, idx) => (
          <div key={s.key} className="flex items-center gap-1">
            <div className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.65rem] font-medium transition-colors',
              idx < stepIndex ? 'bg-green-100 text-green-700' :
              idx === stepIndex ? 'bg-tempo-100 text-tempo-700' :
              'bg-canvas text-t3'
            )}>
              {idx < stepIndex ? <CheckCircle size={12} /> : <span className="w-4 text-center">{idx + 1}</span>}
              {s.label}
            </div>
            {idx < STEPS.length - 1 && <ChevronRight size={12} className="text-t3" />}
          </div>
        ))}
      </div>

      {/* Step Content */}
      {step === 'source' && renderSourceStep()}
      {step === 'preview' && renderPreviewStep()}
      {step === 'validate' && renderValidateStep()}
      {step === 'import' && renderImportStep()}

      {/* Footer Navigation */}
      {!(step === 'import' && (importResult || isImporting)) && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-divider">
          <Button
            variant="ghost"
            size="sm"
            onClick={step === 'source' ? handleClose : handleBack}
          >
            <ChevronLeft size={14} />
            {step === 'source' ? 'Cancel' : 'Back'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleNext}
            disabled={!canProceed()}
          >
            {step === 'validate' ? 'Start Import' : 'Continue'}
            <ChevronRight size={14} />
          </Button>
        </div>
      )}
    </Modal>
  )
}
