/**
 * Excel Template Generator & Parser
 *
 * Generates downloadable .xlsx employee import templates and parses uploaded Excel files.
 * Uses the SheetJS (xlsx) library for reading/writing Excel files.
 *
 * The template covers ALL modules across the integrated platform:
 * Core HR, Payroll & Banking, Compensation, Benefits, Time & Attendance,
 * IT & Identity, Emergency Contact, Documents/Compliance, and Notes.
 */

import * as XLSX from 'xlsx'

// ============================================================
// CONSTANTS – 63 FIELDS ACROSS ALL MODULES
// ============================================================

const TEMPLATE_HEADERS = [
  // ── Core HR (Personal) ──────────────────────────────────
  'Full Name',              // 1
  'Email',                  // 2
  'Personal Email',         // 3
  'Job Title',              // 4
  'Department',             // 5
  'Country',                // 6
  'Level',                  // 7
  'Hire Date',              // 8
  'Phone',                  // 9
  'Role',                   // 10
  'Manager Email',          // 11
  'Location',               // 12
  'Employment Type',        // 13
  'Employee ID',            // 14
  'Date of Birth',          // 15
  'Gender',                 // 16
  'Marital Status',         // 17
  'Nationality',            // 18
  'National ID',            // 19

  // ── Address ─────────────────────────────────────────────
  'Street Address',         // 20
  'City',                   // 21
  'State/Province',         // 22
  'Postal Code',            // 23
  'Address Country',        // 24

  // ── Payroll & Banking ───────────────────────────────────
  'Base Salary',            // 25
  'Pay Currency',           // 26
  'Pay Frequency',          // 27
  'Bank Name',              // 28
  'Bank Branch Code',       // 29
  'Bank Account Number',    // 30
  'Bank Account Name',      // 31
  'Mobile Money Provider',  // 32
  'Mobile Money Number',    // 33
  'Tax ID Number',          // 34
  'Social Security Number', // 35
  'Pension ID',             // 36

  // ── Compensation ────────────────────────────────────────
  'Bonus Target %',         // 37
  'Equity/Stock Units',     // 38
  'Pay Band/Grade',         // 39
  'Allowance - Housing',    // 40
  'Allowance - Transport',  // 41
  'Allowance - Medical',    // 42

  // ── Benefits ────────────────────────────────────────────
  'Medical Plan',           // 43
  'Dental Plan',            // 44
  'Life Insurance',         // 45
  'Number of Dependents',   // 46

  // ── Time & Attendance ───────────────────────────────────
  'Work Schedule',          // 47
  'Weekly Hours',           // 48
  'Timezone',               // 49
  'Shift Type',             // 50

  // ── IT & Identity ──────────────────────────────────────
  'AD/SSO Username',        // 51
  'Corporate Email',        // 52
  'Device Preference',      // 53

  // ── Emergency Contact ───────────────────────────────────
  'Emergency Contact Name',         // 54
  'Emergency Contact Phone',        // 55
  'Emergency Contact Relationship', // 56

  // ── Documents / Compliance ──────────────────────────────
  'Passport Number',        // 57
  'Work Permit Number',     // 58
  'Work Permit Expiry',     // 59
  'Highest Education',      // 60
  'University/Institution', // 61
  'Previous Employer',      // 62

  // ── Notes ───────────────────────────────────────────────
  'Onboarding Notes',       // 63
]

// Header column color-coding by module group (hex RGB without #)
const HEADER_COLORS: { range: [number, number]; color: string }[] = [
  { range: [0, 18],  color: '4472C4' },  // Core HR – Blue
  { range: [19, 23], color: '4472C4' },  // Address – Blue (part of Core HR)
  { range: [24, 35], color: '70AD47' },  // Payroll & Banking – Green
  { range: [36, 41], color: 'ED7D31' },  // Compensation – Orange
  { range: [42, 45], color: '7030A0' },  // Benefits – Purple
  { range: [46, 49], color: '00B0F0' },  // Time & Attendance – Teal
  { range: [50, 52], color: 'A5A5A5' },  // IT & Identity – Grey
  { range: [53, 55], color: 'FF0000' },  // Emergency Contact – Red
  { range: [56, 61], color: 'BF8F00' },  // Documents/Compliance – Brown
  { range: [62, 62], color: 'A5A5A5' },  // Notes – Grey
]

const SAMPLE_ROWS: string[][] = [
  [
    // Core HR
    'Adaeze Okafor', 'adaeze.okafor@temporuns.com', 'adaeze.personal@gmail.com',
    'Software Engineer', 'Engineering', 'NG', 'Mid-Level', '2026-03-01',
    '+234 801 234 5678', 'employee', 'chika.nwosu@temporuns.com', 'Lagos',
    'full_time', 'EMP-001', '1995-06-15', 'female', 'single', 'Nigerian', 'NG-NIN-12345678901',
    // Address
    '42 Marina Road, Victoria Island', 'Lagos', 'Lagos State', '101001', 'NG',
    // Payroll & Banking
    '8500000', 'NGN', 'monthly', 'First Bank', 'FBNGNG', '3012345678', 'Adaeze Okafor',
    'MTN MoMo', '+234 801 234 5678', 'NG-TIN-12345678', '', 'PEN-NG-0001',
    // Compensation
    '10', '', 'IC3', '150000', '50000', '100000',
    // Benefits
    'Premium', 'Basic', 'Yes', '0',
    // Time & Attendance
    'Mon-Fri 9:00-17:00', '40', 'Africa/Lagos', 'day',
    // IT & Identity
    'aokafor', '', 'mac',
    // Emergency Contact
    'Emeka Okafor', '+234 802 345 6789', 'parent',
    // Documents / Compliance
    'A12345678', '', '', 'bachelor', 'University of Lagos', 'Andela',
    // Notes
    'Relocating from Abuja; needs workstation setup',
  ],
  [
    // Core HR
    'Wanjiku Kamau', 'wanjiku.kamau@temporuns.com', 'wanjiku.k@yahoo.com',
    'HR Business Partner', 'Human Resources', 'KE', 'Senior', '2025-11-01',
    '+254 722 345 678', 'hrbp', '', 'Nairobi',
    'full_time', 'EMP-002', '1990-03-22', 'female', 'married', 'Kenyan', 'KE-ID-34567890',
    // Address
    '15 Kenyatta Avenue', 'Nairobi', 'Nairobi County', '00100', 'KE',
    // Payroll & Banking
    '4800000', 'KES', 'monthly', 'Equity Bank', 'EQBLKENA', '1234567890', 'Wanjiku Kamau',
    'M-Pesa', '+254 722 345 678', 'KE-KRA-A012345678B', 'NSSF-KE-123456', 'PEN-KE-0002',
    // Compensation
    '15', '200', 'M2', '80000', '30000', '60000',
    // Benefits
    'Premium', 'Premium', 'Yes', '2',
    // Time & Attendance
    'Mon-Fri 8:00-17:00', '45', 'Africa/Nairobi', 'day',
    // IT & Identity
    'wkamau', '', 'windows',
    // Emergency Contact
    'Joseph Kamau', '+254 733 456 789', 'spouse',
    // Documents / Compliance
    'B23456789', 'WP-KE-001', '2028-12-31', 'master', 'University of Nairobi', 'Safaricom',
    // Notes
    'Bilingual (English/Swahili); CIPD certified',
  ],
  [
    // Core HR
    'Oluwaseun Adeyemi', 'oluwaseun.adeyemi@temporuns.com', 'seun.a@outlook.com',
    'Finance Manager', 'Finance', 'NG', 'Manager', '2024-06-15',
    '+234 803 456 7890', 'manager', 'wanjiku.kamau@temporuns.com', 'Abuja',
    'full_time', 'EMP-003', '1988-11-10', 'male', 'married', 'Nigerian', 'NG-NIN-98765432101',
    // Address
    '8 Ademola Adetokunbo Crescent, Wuse II', 'Abuja', 'FCT', '900001', 'NG',
    // Payroll & Banking
    '12000000', 'NGN', 'monthly', 'GTBank', 'GTBINGLA', '0123456789', 'Oluwaseun Adeyemi',
    '', '', 'NG-TIN-87654321', '', 'PEN-NG-0003',
    // Compensation
    '20', '500', 'M3', '200000', '80000', '120000',
    // Benefits
    'Premium', 'Premium', 'Yes', '3',
    // Time & Attendance
    'Mon-Fri 8:30-17:30', '45', 'Africa/Lagos', 'day',
    // IT & Identity
    'oadeyemi', '', 'windows',
    // Emergency Contact
    'Funke Adeyemi', '+234 805 678 9012', 'spouse',
    // Documents / Compliance
    'C34567890', '', '', 'master', 'University of Ibadan', 'PwC Nigeria',
    // Notes
    'ICAN certified; handles multi-entity payroll',
  ],
]

const FIELD_GUIDE = [
  ['Field', 'Required', 'Format / Type', 'Description', 'Example', 'Module'],
  // Core HR
  ['Full Name', 'Yes', 'Text', 'Employee full legal name', 'Adaeze Okafor', 'Core HR'],
  ['Email', 'Yes', 'Email', 'Work email address (must be unique)', 'adaeze@temporuns.com', 'Core HR'],
  ['Personal Email', 'No', 'Email', 'Personal/private email address', 'adaeze.p@gmail.com', 'Core HR'],
  ['Job Title', 'Yes', 'Text', 'Current job title or position', 'Software Engineer', 'Core HR'],
  ['Department', 'Yes', 'Text', 'Department name (created if new)', 'Engineering', 'Core HR'],
  ['Country', 'Yes', 'ISO 3166-1 alpha-2', 'Two-letter country code for employment', 'NG, KE, US, GB', 'Core HR'],
  ['Level', 'No', 'Text/Enum', 'Seniority level (see Dropdown Values)', 'Mid-Level', 'Core HR'],
  ['Hire Date', 'Yes', 'YYYY-MM-DD', 'Date of hire / employment start', '2026-03-01', 'Core HR'],
  ['Phone', 'No', 'E.164 or local', 'Phone number with country code', '+234 801 234 5678', 'Core HR'],
  ['Role', 'No', 'Enum', 'System role (see Dropdown Values)', 'employee', 'Core HR'],
  ['Manager Email', 'No', 'Email', 'Direct manager email (must exist in system)', 'manager@temporuns.com', 'Core HR'],
  ['Location', 'No', 'Text', 'Office location or city', 'Lagos', 'Core HR'],
  ['Employment Type', 'No', 'Enum', 'Type of employment (see Dropdown Values)', 'full_time', 'Core HR'],
  ['Employee ID', 'No', 'Text', 'Internal badge/employee number', 'EMP-001', 'Core HR'],
  ['Date of Birth', 'No', 'YYYY-MM-DD', 'Date of birth', '1995-06-15', 'Core HR'],
  ['Gender', 'No', 'Enum', 'Gender (see Dropdown Values)', 'female', 'Core HR'],
  ['Marital Status', 'No', 'Enum', 'Marital status (see Dropdown Values)', 'single', 'Core HR'],
  ['Nationality', 'No', 'Text', 'Nationality / citizenship', 'Nigerian', 'Core HR'],
  ['National ID', 'No', 'Text', 'National ID number (NIN, SSN, etc.)', 'NG-NIN-12345678901', 'Core HR'],
  // Address
  ['Street Address', 'No', 'Text', 'Street address line', '42 Marina Road', 'Core HR'],
  ['City', 'No', 'Text', 'City of residence', 'Lagos', 'Core HR'],
  ['State/Province', 'No', 'Text', 'State, province, or region', 'Lagos State', 'Core HR'],
  ['Postal Code', 'No', 'Text', 'Postal / ZIP code', '101001', 'Core HR'],
  ['Address Country', 'No', 'ISO 3166-1 alpha-2', 'Country of residence (if different)', 'NG', 'Core HR'],
  // Payroll & Banking
  ['Base Salary', 'No', 'Number', 'Annual base salary (in minor units / cents)', '8500000', 'Payroll'],
  ['Pay Currency', 'No', 'ISO 4217', 'Three-letter currency code', 'NGN, KES, USD', 'Payroll'],
  ['Pay Frequency', 'No', 'Enum', 'Pay frequency (see Dropdown Values)', 'monthly', 'Payroll'],
  ['Bank Name', 'No', 'Text', 'Bank name for payroll', 'First Bank', 'Payroll'],
  ['Bank Branch Code', 'No', 'Text', 'Branch code / SWIFT / sort code', 'FBNGNG', 'Payroll'],
  ['Bank Account Number', 'No', 'Text', 'Bank account number', '3012345678', 'Payroll'],
  ['Bank Account Name', 'No', 'Text', 'Name on bank account', 'Adaeze Okafor', 'Payroll'],
  ['Mobile Money Provider', 'No', 'Text', 'Mobile money provider (M-Pesa, MTN MoMo)', 'MTN MoMo', 'Payroll'],
  ['Mobile Money Number', 'No', 'Text', 'Mobile money phone number', '+234 801 234 5678', 'Payroll'],
  ['Tax ID Number', 'No', 'Text', 'Tax identification number (TIN/KRA PIN)', 'NG-TIN-12345678', 'Payroll'],
  ['Social Security Number', 'No', 'Text', 'Social security / NSSF number', 'NSSF-KE-123456', 'Payroll'],
  ['Pension ID', 'No', 'Text', 'Pension fund ID / PENCOM number', 'PEN-NG-0001', 'Payroll'],
  // Compensation
  ['Bonus Target %', 'No', 'Number (0-100)', 'Annual bonus target as percentage', '10', 'Compensation'],
  ['Equity/Stock Units', 'No', 'Number', 'Number of stock units / options granted', '200', 'Compensation'],
  ['Pay Band/Grade', 'No', 'Text', 'Internal pay band or grade code', 'IC3, M2, D1', 'Compensation'],
  ['Allowance - Housing', 'No', 'Number', 'Monthly housing allowance (in minor units)', '150000', 'Compensation'],
  ['Allowance - Transport', 'No', 'Number', 'Monthly transport allowance (in minor units)', '50000', 'Compensation'],
  ['Allowance - Medical', 'No', 'Number', 'Monthly medical allowance (in minor units)', '100000', 'Compensation'],
  // Benefits
  ['Medical Plan', 'No', 'Text', 'Medical insurance plan name/tier', 'Premium, Standard, Basic', 'Benefits'],
  ['Dental Plan', 'No', 'Text', 'Dental plan name/tier', 'Premium, Basic', 'Benefits'],
  ['Life Insurance', 'No', 'Yes/No', 'Enrolled in life insurance?', 'Yes', 'Benefits'],
  ['Number of Dependents', 'No', 'Number', 'Number of dependents for benefits', '2', 'Benefits'],
  // Time & Attendance
  ['Work Schedule', 'No', 'Text', 'Regular work schedule', 'Mon-Fri 9:00-17:00', 'Time & Attendance'],
  ['Weekly Hours', 'No', 'Number', 'Expected weekly working hours', '40', 'Time & Attendance'],
  ['Timezone', 'No', 'IANA Timezone', 'Employee timezone', 'Africa/Lagos', 'Time & Attendance'],
  ['Shift Type', 'No', 'Enum', 'Shift type (see Dropdown Values)', 'day', 'Time & Attendance'],
  // IT & Identity
  ['AD/SSO Username', 'No', 'Text', 'Active Directory / SSO username', 'aokafor', 'IT'],
  ['Corporate Email', 'No', 'Email', 'Corporate email (if different from Email)', 'a.okafor@corp.com', 'IT'],
  ['Device Preference', 'No', 'Enum', 'Preferred device OS (see Dropdown Values)', 'mac', 'IT'],
  // Emergency Contact
  ['Emergency Contact Name', 'No', 'Text', 'Emergency contact full name', 'Emeka Okafor', 'Emergency'],
  ['Emergency Contact Phone', 'No', 'E.164 or local', 'Emergency contact phone', '+234 802 345 6789', 'Emergency'],
  ['Emergency Contact Relationship', 'No', 'Enum', 'Relationship (see Dropdown Values)', 'parent', 'Emergency'],
  // Documents / Compliance
  ['Passport Number', 'No', 'Text', 'Passport number', 'A12345678', 'Compliance'],
  ['Work Permit Number', 'No', 'Text', 'Work permit / visa number', 'WP-KE-001', 'Compliance'],
  ['Work Permit Expiry', 'No', 'YYYY-MM-DD', 'Work permit expiry date', '2028-12-31', 'Compliance'],
  ['Highest Education', 'No', 'Enum', 'Highest level of education (see Dropdown Values)', 'bachelor', 'Compliance'],
  ['University/Institution', 'No', 'Text', 'University or institution name', 'University of Lagos', 'Compliance'],
  ['Previous Employer', 'No', 'Text', 'Most recent previous employer', 'Andela', 'Compliance'],
  // Notes
  ['Onboarding Notes', 'No', 'Text', 'Free-text notes for onboarding team', 'Needs workstation setup', 'Onboarding'],
]

const DROPDOWN_VALUES = [
  ['Category', 'Valid Values', 'Description'],
  // Role
  ['Role', 'owner', 'Full platform owner with all permissions'],
  ['Role', 'admin', 'Administrator with most permissions'],
  ['Role', 'hrbp', 'HR Business Partner with people management access'],
  ['Role', 'manager', 'Team manager with reports access'],
  ['Role', 'employee', 'Standard employee (default)'],
  // Employment Type
  ['Employment Type', 'full_time', 'Full-time employee'],
  ['Employment Type', 'part_time', 'Part-time employee'],
  ['Employment Type', 'contractor', 'Independent contractor'],
  ['Employment Type', 'intern', 'Intern or trainee'],
  // Level
  ['Level', 'Intern', 'Internship level'],
  ['Level', 'Junior', 'Junior / Entry level'],
  ['Level', 'Mid-Level', 'Mid-level'],
  ['Level', 'Senior', 'Senior level'],
  ['Level', 'Lead', 'Team lead'],
  ['Level', 'Manager', 'People manager'],
  ['Level', 'Senior Manager', 'Senior people manager'],
  ['Level', 'Director', 'Director level'],
  ['Level', 'VP', 'Vice President'],
  ['Level', 'SVP', 'Senior Vice President'],
  ['Level', 'C-Suite', 'C-suite executive'],
  ['Level', 'Executive', 'Executive / Board level'],
  // Pay Frequency
  ['Pay Frequency', 'weekly', 'Paid every week'],
  ['Pay Frequency', 'bi_weekly', 'Paid every two weeks'],
  ['Pay Frequency', 'semi_monthly', 'Paid twice a month (1st & 15th)'],
  ['Pay Frequency', 'monthly', 'Paid once a month'],
  // Gender
  ['Gender', 'male', 'Male'],
  ['Gender', 'female', 'Female'],
  ['Gender', 'non_binary', 'Non-binary'],
  ['Gender', 'prefer_not_to_say', 'Prefer not to say'],
  // Marital Status
  ['Marital Status', 'single', 'Single'],
  ['Marital Status', 'married', 'Married'],
  ['Marital Status', 'divorced', 'Divorced'],
  ['Marital Status', 'widowed', 'Widowed'],
  ['Marital Status', 'domestic_partnership', 'Domestic partnership'],
  // Shift Type
  ['Shift Type', 'day', 'Day shift'],
  ['Shift Type', 'night', 'Night shift'],
  ['Shift Type', 'rotating', 'Rotating shifts'],
  ['Shift Type', 'flexible', 'Flexible / self-scheduled'],
  // Device Preference
  ['Device Preference', 'windows', 'Windows PC / laptop'],
  ['Device Preference', 'mac', 'Apple Mac'],
  ['Device Preference', 'linux', 'Linux workstation'],
  // Emergency Contact Relationship
  ['Emergency Contact Relationship', 'spouse', 'Spouse'],
  ['Emergency Contact Relationship', 'parent', 'Parent'],
  ['Emergency Contact Relationship', 'sibling', 'Sibling'],
  ['Emergency Contact Relationship', 'child', 'Child'],
  ['Emergency Contact Relationship', 'friend', 'Friend'],
  ['Emergency Contact Relationship', 'other', 'Other'],
  // Highest Education
  ['Highest Education', 'high_school', 'High school / Secondary school'],
  ['Highest Education', 'associate', 'Associate degree'],
  ['Highest Education', 'bachelor', 'Bachelor\'s degree'],
  ['Highest Education', 'master', 'Master\'s degree'],
  ['Highest Education', 'doctorate', 'Doctorate / PhD'],
  ['Highest Education', 'professional', 'Professional certification (CPA, CIPD, etc.)'],
  // Country (common)
  ['Country', 'US', 'United States'],
  ['Country', 'GB', 'United Kingdom'],
  ['Country', 'NG', 'Nigeria'],
  ['Country', 'KE', 'Kenya'],
  ['Country', 'TZ', 'Tanzania'],
  ['Country', 'ZA', 'South Africa'],
  ['Country', 'GH', 'Ghana'],
  ['Country', 'CA', 'Canada'],
  ['Country', 'DE', 'Germany'],
  ['Country', 'FR', 'France'],
  ['Country', 'BR', 'Brazil'],
  ['Country', 'IN', 'India'],
  ['Country', 'AU', 'Australia'],
  ['Country', 'JP', 'Japan'],
  ['Country', 'AE', 'United Arab Emirates'],
  ['Country', 'SG', 'Singapore'],
  ['Country', 'RW', 'Rwanda'],
  ['Country', 'UG', 'Uganda'],
  ['Country', 'ET', 'Ethiopia'],
  ['Country', 'SN', 'Senegal'],
]

// ============================================================
// GENERATE TEMPLATE
// ============================================================

/**
 * Creates and downloads an .xlsx employee import template with 3 sheets:
 * - Employee Import: all 63 headers with 3 sample rows, color-coded by module
 * - Field Guide: every field explained with format, module, and examples
 * - Dropdown Values: valid values for all enum/dropdown fields
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
    return { wch: Math.min(maxLen + 4, 44) }
  })
  ws1['!cols'] = colWidths

  // Color-code header cells by module group
  for (const group of HEADER_COLORS) {
    for (let col = group.range[0]; col <= group.range[1]; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: col })
      if (!ws1[cellRef]) continue
      ws1[cellRef].s = {
        fill: { fgColor: { rgb: group.color } },
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        alignment: { horizontal: 'center' },
      }
    }
  }

  XLSX.utils.book_append_sheet(wb, ws1, 'Employee Import')

  // Sheet 2: Field Guide
  const ws2 = XLSX.utils.aoa_to_sheet(FIELD_GUIDE)
  ws2['!cols'] = [
    { wch: 30 },
    { wch: 10 },
    { wch: 22 },
    { wch: 52 },
    { wch: 30 },
    { wch: 18 },
  ]
  // Bold header row
  for (let col = 0; col < 6; col++) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: col })
    if (ws2[cellRef]) {
      ws2[cellRef].s = { font: { bold: true }, fill: { fgColor: { rgb: 'D9E2F3' } } }
    }
  }
  XLSX.utils.book_append_sheet(wb, ws2, 'Field Guide')

  // Sheet 3: Dropdown Values
  const ws3 = XLSX.utils.aoa_to_sheet(DROPDOWN_VALUES)
  ws3['!cols'] = [
    { wch: 30 },
    { wch: 22 },
    { wch: 48 },
  ]
  for (let col = 0; col < 3; col++) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: col })
    if (ws3[cellRef]) {
      ws3[cellRef].s = { font: { bold: true }, fill: { fgColor: { rgb: 'D9E2F3' } } }
    }
  }
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
