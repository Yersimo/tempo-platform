/**
 * Excel Template Generator & Parser
 *
 * Generates downloadable .xlsx employee import templates and parses uploaded Excel files.
 * Uses the SheetJS (xlsx) library for reading/writing Excel files.
 */

import * as XLSX from 'xlsx'

// ============================================================
// CONSTANTS
// ============================================================

const TEMPLATE_HEADERS = [
  'Full Name',
  'Email',
  'Job Title',
  'Department',
  'Country',
  'Level',
  'Hire Date',
  'Phone',
  'Role',
  'Manager Email',
  'Location',
  'Employment Type',
  'Bank Name',
  'Bank Account Number',
  'Bank Account Name',
  'Tax ID Number',
  'Date of Birth',
  'Emergency Contact Name',
  'Emergency Contact Phone',
]

const SAMPLE_ROWS = [
  [
    'Adaeze Okafor',
    'adaeze.okafor@temporuns.com',
    'Software Engineer',
    'Engineering',
    'NG',
    'Mid',
    '2026-03-01',
    '+234 801 234 5678',
    'employee',
    'chika.nwosu@temporuns.com',
    'Lagos',
    'full_time',
    'First Bank',
    '3012345678',
    'Adaeze Okafor',
    'NG-TIN-12345678',
    '1995-06-15',
    'Emeka Okafor',
    '+234 802 345 6789',
  ],
  [
    'James Chen',
    'james.chen@temporuns.com',
    'Product Manager',
    'Product',
    'US',
    'Senior',
    '2026-02-15',
    '+1 415 555 0199',
    'manager',
    'sarah.miller@temporuns.com',
    'San Francisco',
    'full_time',
    'Chase',
    '9876543210',
    'James Chen',
    'US-SSN-XXX-XX-1234',
    '1990-11-22',
    'Li Wei Chen',
    '+1 415 555 0200',
  ],
  [
    'Maria Silva',
    'maria.silva@temporuns.com',
    'UX Designer',
    'Design',
    'BR',
    'Junior',
    '2026-04-01',
    '+55 11 98765 4321',
    'employee',
    'james.chen@temporuns.com',
    'Sao Paulo',
    'contractor',
    'Banco do Brasil',
    '1122334455',
    'Maria Silva',
    'BR-CPF-123.456.789-00',
    '1998-03-10',
    'Carlos Silva',
    '+55 11 91234 5678',
  ],
]

const FIELD_GUIDE = [
  ['Field', 'Required', 'Format', 'Description', 'Example'],
  ['Full Name', 'Yes', 'Text', 'Employee full name', 'Adaeze Okafor'],
  ['Email', 'Yes', 'Email', 'Work email address (must be unique)', 'adaeze@temporuns.com'],
  ['Job Title', 'No', 'Text', 'Current job title or position', 'Software Engineer'],
  ['Department', 'No', 'Text', 'Department name', 'Engineering'],
  ['Country', 'No', 'ISO 3166-1 alpha-2', 'Two-letter country code', 'NG, US, GB, BR'],
  ['Level', 'No', 'Text', 'Seniority level', 'Junior, Mid, Senior, Lead, Director, VP, C-Level'],
  ['Hire Date', 'No', 'YYYY-MM-DD', 'Date of hire', '2026-03-01'],
  ['Phone', 'No', 'E.164 or local', 'Phone number with country code', '+234 801 234 5678'],
  ['Role', 'No', 'Enum', 'System role (see Dropdown Values sheet)', 'employee'],
  ['Manager Email', 'No', 'Email', 'Direct manager email (must exist in system)', 'manager@temporuns.com'],
  ['Location', 'No', 'Text', 'Office location or city', 'Lagos'],
  ['Employment Type', 'No', 'Enum', 'Type of employment (see Dropdown Values sheet)', 'full_time'],
  ['Bank Name', 'No', 'Text', 'Bank name for payroll', 'First Bank'],
  ['Bank Account Number', 'No', 'Text', 'Bank account number', '3012345678'],
  ['Bank Account Name', 'No', 'Text', 'Name on bank account', 'Adaeze Okafor'],
  ['Tax ID Number', 'No', 'Text', 'Tax identification number', 'NG-TIN-12345678'],
  ['Date of Birth', 'No', 'YYYY-MM-DD', 'Date of birth', '1995-06-15'],
  ['Emergency Contact Name', 'No', 'Text', 'Emergency contact full name', 'Emeka Okafor'],
  ['Emergency Contact Phone', 'No', 'E.164 or local', 'Emergency contact phone number', '+234 802 345 6789'],
]

const DROPDOWN_VALUES = [
  ['Category', 'Valid Values', 'Description'],
  ['Role', 'owner', 'Full platform owner with all permissions'],
  ['Role', 'admin', 'Administrator with most permissions'],
  ['Role', 'hrbp', 'HR Business Partner with people management access'],
  ['Role', 'manager', 'Team manager with reports access'],
  ['Role', 'employee', 'Standard employee (default)'],
  ['Employment Type', 'full_time', 'Full-time employee'],
  ['Employment Type', 'part_time', 'Part-time employee'],
  ['Employment Type', 'contractor', 'Independent contractor'],
  ['Employment Type', 'intern', 'Intern or trainee'],
  ['Level', 'Intern', 'Internship level'],
  ['Level', 'Junior', 'Junior / Entry level'],
  ['Level', 'Mid', 'Mid-level'],
  ['Level', 'Senior', 'Senior level'],
  ['Level', 'Lead', 'Team lead'],
  ['Level', 'Staff', 'Staff level (senior IC)'],
  ['Level', 'Principal', 'Principal level'],
  ['Level', 'Director', 'Director level'],
  ['Level', 'VP', 'Vice President'],
  ['Level', 'C-Level', 'C-suite executive'],
  ['Country', 'US', 'United States'],
  ['Country', 'GB', 'United Kingdom'],
  ['Country', 'NG', 'Nigeria'],
  ['Country', 'CA', 'Canada'],
  ['Country', 'DE', 'Germany'],
  ['Country', 'FR', 'France'],
  ['Country', 'BR', 'Brazil'],
  ['Country', 'IN', 'India'],
  ['Country', 'AU', 'Australia'],
  ['Country', 'JP', 'Japan'],
  ['Country', 'KE', 'Kenya'],
  ['Country', 'GH', 'Ghana'],
  ['Country', 'ZA', 'South Africa'],
  ['Country', 'AE', 'United Arab Emirates'],
  ['Country', 'SG', 'Singapore'],
]

// ============================================================
// GENERATE TEMPLATE
// ============================================================

/**
 * Creates and downloads an .xlsx employee import template with 3 sheets:
 * - Employee Import: headers + 3 sample rows
 * - Field Guide: field descriptions, required/optional, format, examples
 * - Dropdown Values: valid values for enum fields
 */
export function generateEmployeeImportTemplate(): void {
  const wb = XLSX.utils.book_new()

  // Sheet 1: Employee Import
  const importData = [TEMPLATE_HEADERS, ...SAMPLE_ROWS]
  const ws1 = XLSX.utils.aoa_to_sheet(importData)

  // Auto-width columns
  const colWidths = TEMPLATE_HEADERS.map((header, colIdx) => {
    let maxLen = header.length
    for (const row of SAMPLE_ROWS) {
      const cellLen = (row[colIdx] || '').length
      if (cellLen > maxLen) maxLen = cellLen
    }
    return { wch: Math.min(maxLen + 4, 40) }
  })
  ws1['!cols'] = colWidths

  XLSX.utils.book_append_sheet(wb, ws1, 'Employee Import')

  // Sheet 2: Field Guide
  const ws2 = XLSX.utils.aoa_to_sheet(FIELD_GUIDE)
  ws2['!cols'] = [
    { wch: 24 },
    { wch: 10 },
    { wch: 20 },
    { wch: 48 },
    { wch: 30 },
  ]
  XLSX.utils.book_append_sheet(wb, ws2, 'Field Guide')

  // Sheet 3: Dropdown Values
  const ws3 = XLSX.utils.aoa_to_sheet(DROPDOWN_VALUES)
  ws3['!cols'] = [
    { wch: 18 },
    { wch: 16 },
    { wch: 40 },
  ]
  XLSX.utils.book_append_sheet(wb, ws3, 'Dropdown Values')

  // Download
  XLSX.writeFile(wb, 'employee-import-template.xlsx')
}

// ============================================================
// PARSE EXCEL FILE
// ============================================================

/**
 * Reads an uploaded .xlsx or .xls file and returns headers + rows.
 * Uses the first sheet by default. Returns data in the same format
 * as the CSV parser for interoperability.
 */
export function parseExcelFile(file: File): Promise<{ headers: string[]; rows: string[][] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })

        // Use the first sheet
        const firstSheetName = workbook.SheetNames[0]
        if (!firstSheetName) {
          reject(new Error('No sheets found in the Excel file'))
          return
        }

        const worksheet = workbook.Sheets[firstSheetName]
        const jsonData: string[][] = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          raw: false,
          defval: '',
        })

        if (jsonData.length === 0) {
          resolve({ headers: [], rows: [] })
          return
        }

        const headers = jsonData[0].map((h: string) => String(h).trim())
        const rows = jsonData.slice(1).filter(row =>
          row.some((cell: string) => String(cell).trim() !== '')
        ).map(row => row.map((cell: string) => String(cell).trim()))

        resolve({ headers, rows })
      } catch (err) {
        reject(new Error('Failed to parse Excel file. Please ensure it is a valid .xlsx or .xls file.'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}
