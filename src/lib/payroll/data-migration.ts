/**
 * Payroll Data Migration Wizard
 *
 * Imports employee payroll data from Excel/CSV files.
 * Validates data, maps columns, detects duplicates, and prepares
 * records for database insertion.
 */

export interface MigrationColumn {
  key: string
  label: string
  required: boolean
  type: 'string' | 'number' | 'date' | 'email' | 'currency' | 'country'
  examples: string[]
}

export interface MigrationMapping {
  sourceColumn: string
  targetColumn: string
}

export interface MigrationValidationError {
  row: number
  column: string
  value: string
  error: string
  severity: 'error' | 'warning'
}

export interface MigrationPreview {
  totalRows: number
  validRows: number
  errorRows: number
  warningRows: number
  duplicates: number
  newEmployees: number
  updatedEmployees: number
  errors: MigrationValidationError[]
  preview: Record<string, any>[]  // First 5 rows mapped
}

export interface MigrationResult {
  success: boolean
  imported: number
  updated: number
  skipped: number
  errors: MigrationValidationError[]
}

/**
 * Standard columns for payroll data import
 */
export const MIGRATION_COLUMNS: MigrationColumn[] = [
  { key: 'employee_id', label: 'Employee ID', required: false, type: 'string', examples: ['EMP001', 'E-2024-001'] },
  { key: 'full_name', label: 'Full Name', required: true, type: 'string', examples: ['Kwame Asante', 'Ngozi Okafor'] },
  { key: 'email', label: 'Email Address', required: true, type: 'email', examples: ['k.asante@company.com'] },
  { key: 'department', label: 'Department', required: false, type: 'string', examples: ['Finance', 'Operations'] },
  { key: 'job_title', label: 'Job Title', required: false, type: 'string', examples: ['Senior Analyst', 'Manager'] },
  { key: 'country', label: 'Country', required: true, type: 'country', examples: ['Ghana', 'GH', 'Nigeria', 'NG'] },
  { key: 'start_date', label: 'Start Date', required: false, type: 'date', examples: ['2023-01-15', '15/01/2023'] },
  { key: 'monthly_salary', label: 'Monthly Salary', required: true, type: 'currency', examples: ['5000', '5,000.00', 'GHS 5000'] },
  { key: 'currency', label: 'Currency', required: false, type: 'string', examples: ['GHS', 'NGN', 'USD', 'KES'] },
  { key: 'bank_name', label: 'Bank Name', required: false, type: 'string', examples: ['Ecobank', 'Access Bank'] },
  { key: 'bank_code', label: 'Bank/Sort Code', required: false, type: 'string', examples: ['130100', '044'] },
  { key: 'account_number', label: 'Account Number', required: false, type: 'string', examples: ['0123456789'] },
  { key: 'tax_id', label: 'Tax ID / TIN', required: false, type: 'string', examples: ['GHA-123456789', 'TIN001'] },
  { key: 'pension_id', label: 'Pension ID (SSNIT/PFA/NSSF)', required: false, type: 'string', examples: ['SSNIT-12345', 'PFA-001'] },
  { key: 'annual_leave_balance', label: 'Leave Balance (Days)', required: false, type: 'number', examples: ['15', '21'] },
  { key: 'housing_allowance', label: 'Housing Allowance', required: false, type: 'currency', examples: ['500', '1000'] },
  { key: 'transport_allowance', label: 'Transport Allowance', required: false, type: 'currency', examples: ['200', '300'] },
  { key: 'level', label: 'Level', required: false, type: 'string', examples: ['Associate', 'Manager', 'Director'] },
  { key: 'date_of_birth', label: 'Date of Birth', required: false, type: 'date', examples: ['1990-05-15'] },
  { key: 'phone', label: 'Phone Number', required: false, type: 'string', examples: ['+233201234567'] },
]

/**
 * Country name/code normalization
 */
const COUNTRY_ALIASES: Record<string, string> = {
  'ghana': 'GH', 'gh': 'GH',
  'nigeria': 'NG', 'ng': 'NG',
  'kenya': 'KE', 'ke': 'KE',
  'south africa': 'ZA', 'za': 'ZA',
  'ivory coast': 'CI', "cote d'ivoire": 'CI', "côte d'ivoire": 'CI', 'ci': 'CI',
  'senegal': 'SN', 'sn': 'SN',
  'cameroon': 'CM', 'cm': 'CM',
  'tanzania': 'TZ', 'tz': 'TZ',
  'uganda': 'UG', 'ug': 'UG',
  'rwanda': 'RW', 'rw': 'RW',
  'united states': 'US', 'usa': 'US', 'us': 'US',
  'united kingdom': 'UK', 'gb': 'UK', 'uk': 'UK',
}

/**
 * Auto-detect column mappings from CSV/Excel headers
 */
export function autoDetectMappings(headers: string[]): MigrationMapping[] {
  const mappings: MigrationMapping[] = []
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim().replace(/[^a-z0-9]/g, '_'))

  const HEADER_PATTERNS: Record<string, string[]> = {
    'full_name': ['name', 'full_name', 'employee_name', 'fullname', 'staff_name'],
    'email': ['email', 'email_address', 'e_mail', 'work_email'],
    'employee_id': ['employee_id', 'emp_id', 'staff_id', 'id', 'employee_number', 'emp_no'],
    'department': ['department', 'dept', 'division', 'unit'],
    'job_title': ['job_title', 'title', 'position', 'role', 'designation'],
    'country': ['country', 'location', 'country_code', 'nation'],
    'start_date': ['start_date', 'hire_date', 'date_joined', 'joining_date', 'employment_date'],
    'monthly_salary': ['salary', 'monthly_salary', 'basic_salary', 'gross_salary', 'basic_pay', 'gross_pay', 'monthly_pay'],
    'currency': ['currency', 'ccy', 'pay_currency'],
    'bank_name': ['bank_name', 'bank', 'banking_institution'],
    'bank_code': ['bank_code', 'sort_code', 'routing_number', 'branch_code'],
    'account_number': ['account_number', 'account_no', 'bank_account', 'acct_no'],
    'tax_id': ['tax_id', 'tin', 'tax_number', 'tax_identification'],
    'pension_id': ['pension_id', 'ssnit', 'ssnit_number', 'pfa', 'nssf', 'pension_number'],
    'annual_leave_balance': ['leave_balance', 'annual_leave', 'leave_days', 'vacation_balance'],
    'housing_allowance': ['housing_allowance', 'housing', 'rent_allowance'],
    'transport_allowance': ['transport_allowance', 'transport', 'travel_allowance'],
    'level': ['level', 'grade', 'band', 'job_level'],
    'date_of_birth': ['date_of_birth', 'dob', 'birth_date', 'birthday'],
    'phone': ['phone', 'phone_number', 'mobile', 'cell', 'telephone'],
  }

  for (let i = 0; i < headers.length; i++) {
    const normalized = normalizedHeaders[i]
    let matched = false

    for (const [targetKey, patterns] of Object.entries(HEADER_PATTERNS)) {
      if (patterns.includes(normalized)) {
        mappings.push({ sourceColumn: headers[i], targetColumn: targetKey })
        matched = true
        break
      }
    }

    if (!matched) {
      // Fuzzy match: check if header contains key pattern
      for (const [targetKey, patterns] of Object.entries(HEADER_PATTERNS)) {
        if (patterns.some(p => normalized.includes(p) || p.includes(normalized))) {
          mappings.push({ sourceColumn: headers[i], targetColumn: targetKey })
          matched = true
          break
        }
      }
    }
  }

  return mappings
}

/**
 * Parse a currency value from various formats
 */
function parseCurrencyValue(value: string): number | null {
  if (!value || value.trim() === '') return null
  // Remove currency symbols, spaces, commas
  const cleaned = value.replace(/[^\d.\-]/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : Math.round(num * 100) // Convert to cents
}

/**
 * Parse a date from various formats
 */
function parseDateValue(value: string): string | null {
  if (!value || value.trim() === '') return null
  // Try ISO format first
  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) return value.slice(0, 10)

  // Try DD/MM/YYYY
  const dmyMatch = value.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/)
  if (dmyMatch) return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`

  // Try MM/DD/YYYY
  const mdyMatch = value.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/)
  if (mdyMatch) {
    const month = parseInt(mdyMatch[1])
    if (month <= 12) return `${mdyMatch[3]}-${mdyMatch[1].padStart(2, '0')}-${mdyMatch[2].padStart(2, '0')}`
  }

  return null
}

/**
 * Normalize country value
 */
function normalizeCountry(value: string): string | null {
  if (!value) return null
  const normalized = value.toLowerCase().trim()
  return COUNTRY_ALIASES[normalized] || (normalized.length === 2 ? normalized.toUpperCase() : null)
}

/**
 * Validate and preview migration data
 */
export function validateMigrationData(
  rows: Record<string, string>[],
  mappings: MigrationMapping[],
  existingEmails: string[] = [],
): MigrationPreview {
  const errors: MigrationValidationError[] = []
  const preview: Record<string, any>[] = []
  let duplicates = 0
  let validRows = 0
  const seenEmails = new Set(existingEmails.map(e => e.toLowerCase()))
  const newEmails = new Set<string>()

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const mapped: Record<string, any> = {}
    let rowHasError = false
    let rowHasWarning = false

    for (const mapping of mappings) {
      const value = row[mapping.sourceColumn] || ''
      const target = mapping.targetColumn
      const colDef = MIGRATION_COLUMNS.find(c => c.key === target)

      if (colDef?.required && (!value || value.trim() === '')) {
        errors.push({ row: i + 2, column: target, value, error: `${colDef.label} is required`, severity: 'error' })
        rowHasError = true
        continue
      }

      if (!value || value.trim() === '') {
        mapped[target] = null
        continue
      }

      switch (colDef?.type) {
        case 'email': {
          const email = value.trim().toLowerCase()
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.push({ row: i + 2, column: target, value, error: 'Invalid email format', severity: 'error' })
            rowHasError = true
          } else if (seenEmails.has(email)) {
            errors.push({ row: i + 2, column: target, value: email, error: 'Duplicate email (already exists)', severity: 'warning' })
            duplicates++
            rowHasWarning = true
          } else if (newEmails.has(email)) {
            errors.push({ row: i + 2, column: target, value: email, error: 'Duplicate email within import file', severity: 'error' })
            rowHasError = true
          }
          newEmails.add(email)
          mapped[target] = email
          break
        }
        case 'currency': {
          const cents = parseCurrencyValue(value)
          if (cents === null) {
            errors.push({ row: i + 2, column: target, value, error: 'Invalid currency amount', severity: 'error' })
            rowHasError = true
          } else {
            mapped[target] = cents
          }
          break
        }
        case 'date': {
          const date = parseDateValue(value)
          if (!date) {
            errors.push({ row: i + 2, column: target, value, error: 'Invalid date format (use YYYY-MM-DD)', severity: 'warning' })
            rowHasWarning = true
          }
          mapped[target] = date
          break
        }
        case 'country': {
          const country = normalizeCountry(value)
          if (!country) {
            errors.push({ row: i + 2, column: target, value, error: 'Unrecognized country', severity: 'error' })
            rowHasError = true
          }
          mapped[target] = country
          break
        }
        case 'number': {
          const num = parseFloat(value.replace(/[^\d.\-]/g, ''))
          if (isNaN(num)) {
            errors.push({ row: i + 2, column: target, value, error: 'Invalid number', severity: 'warning' })
            rowHasWarning = true
          }
          mapped[target] = isNaN(num) ? null : num
          break
        }
        default:
          mapped[target] = value.trim()
      }
    }

    if (!rowHasError) validRows++
    if (preview.length < 5) preview.push(mapped)
  }

  return {
    totalRows: rows.length,
    validRows,
    errorRows: rows.length - validRows,
    warningRows: errors.filter(e => e.severity === 'warning').length,
    duplicates,
    newEmployees: validRows - duplicates,
    updatedEmployees: duplicates,
    errors: errors.slice(0, 50), // Limit error list
    preview,
  }
}

/**
 * Parse CSV text into rows
 */
export function parseCSV(csvText: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = csvText.split('\n').filter(l => l.trim())
  if (lines.length === 0) return { headers: [], rows: [] }

  // Parse header
  const headers = parseCSVLine(lines[0])

  // Parse data rows
  const rows: Record<string, string>[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    const row: Record<string, string> = {}
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] || ''
    }
    rows.push(row)
  }

  return { headers, rows }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

/**
 * Generate a sample CSV template for download
 */
export function generateMigrationTemplate(): string {
  const headers = MIGRATION_COLUMNS.map(c => c.label)
  const sampleRow1 = ['EMP001', 'Kwame Asante', 'k.asante@ecobank.com', 'Retail Banking', 'Relationship Manager', 'Ghana', '2022-03-15', '5000', 'GHS', 'Ecobank Ghana', '130100', '0123456789', 'GHA-TIN-001', 'SSNIT-12345', '15', '500', '200', 'Manager', '1990-05-15', '+233201234567']
  const sampleRow2 = ['EMP002', 'Ngozi Okafor', 'n.okafor@ecobank.com', 'Corporate Banking', 'Branch Manager', 'Nigeria', '2020-01-10', '8000', 'NGN', 'Access Bank', '044', '9876543210', 'NG-TIN-002', 'PFA-67890', '21', '800', '300', 'Senior Manager', '1985-11-20', '+2348012345678']

  return [headers.join(','), sampleRow1.join(','), sampleRow2.join(',')].join('\n')
}
