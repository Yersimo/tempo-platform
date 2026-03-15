import { z } from 'zod'

export interface CSVParseResult {
  valid: CSVEmployeeRow[]
  errors: Array<{ row: number; field: string; message: string }>
  totalRows: number
  validRows: number
}

export interface CSVEmployeeRow {
  fullName: string
  email: string
  jobTitle?: string
  department?: string
  country?: string
  phone?: string
  hireDate?: string
  role?: string
  managerId?: string
  salary?: number
  currency?: string
  level?: string
  managerEmail?: string
  location?: string
  employmentType?: string
  bankName?: string
  bankAccountNumber?: string
  bankAccountName?: string
  taxIdNumber?: string
  dateOfBirth?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const employeeRowSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(255),
  email: z.string().refine(v => emailRegex.test(v), 'Invalid email format'),
  jobTitle: z.string().max(255).optional(),
  department: z.string().max(255).optional(),
  country: z.string().max(100).optional(),
  phone: z.string().max(50).optional(),
  hireDate: z.string().optional(),
  role: z.enum(['owner', 'admin', 'hrbp', 'manager', 'employee']).optional(),
  salary: z.number().positive().optional(),
  currency: z.string().max(10).optional(),
  level: z.string().max(100).optional(),
  managerEmail: z.string().optional(),
  location: z.string().max(255).optional(),
  employmentType: z.enum(['full_time', 'part_time', 'contractor', 'intern']).optional(),
  bankName: z.string().max(255).optional(),
  bankAccountNumber: z.string().max(100).optional(),
  bankAccountName: z.string().max(255).optional(),
  taxIdNumber: z.string().max(100).optional(),
  dateOfBirth: z.string().optional(),
  emergencyContactName: z.string().max(255).optional(),
  emergencyContactPhone: z.string().max(50).optional(),
})

/**
 * Parse a CSV string into validated employee rows.
 * Supports these column headers (case-insensitive, flexible naming):
 * - Full Name / Name / Employee Name
 * - Email / Email Address / Work Email
 * - Job Title / Title / Position / Role Title
 * - Department / Dept
 * - Country / Location
 * - Phone / Phone Number / Mobile
 * - Hire Date / Start Date / Date Hired
 * - Role / Access Role
 * - Salary / Annual Salary / Base Salary
 * - Currency / Salary Currency
 */
export function parseEmployeeCSV(csvContent: string): CSVParseResult {
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0)
  
  if (lines.length < 2) {
    return { valid: [], errors: [{ row: 0, field: 'file', message: 'CSV must have a header row and at least one data row' }], totalRows: 0, validRows: 0 }
  }

  // Parse header row
  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase())
  
  // Map flexible header names to standard field names
  const headerMap = new Map<number, keyof CSVEmployeeRow>()
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i]
    if (['full name', 'name', 'employee name', 'fullname', 'employee'].includes(h)) headerMap.set(i, 'fullName')
    else if (['email', 'email address', 'work email', 'e-mail'].includes(h)) headerMap.set(i, 'email')
    else if (['job title', 'title', 'position', 'role title', 'jobtitle'].includes(h)) headerMap.set(i, 'jobTitle')
    else if (['department', 'dept', 'division'].includes(h)) headerMap.set(i, 'department')
    else if (['country', 'location', 'office'].includes(h)) headerMap.set(i, 'country')
    else if (['phone', 'phone number', 'mobile', 'tel'].includes(h)) headerMap.set(i, 'phone')
    else if (['hire date', 'start date', 'date hired', 'hiredate', 'joining date'].includes(h)) headerMap.set(i, 'hireDate')
    else if (['role', 'access role', 'permission'].includes(h)) headerMap.set(i, 'role')
    else if (['salary', 'annual salary', 'base salary', 'compensation'].includes(h)) headerMap.set(i, 'salary')
    else if (['currency', 'salary currency', 'pay currency'].includes(h)) headerMap.set(i, 'currency')
    else if (['level', 'job level', 'grade', 'band', 'seniority'].includes(h)) headerMap.set(i, 'level')
    else if (['manager email', 'manager_email', 'reports to', 'reports_to', 'manager'].includes(h)) headerMap.set(i, 'managerEmail')
    else if (['location', 'office', 'city', 'work location', 'work_location'].includes(h)) headerMap.set(i, 'location')
    else if (['employment type', 'employment_type', 'emp type', 'type', 'contract type'].includes(h)) headerMap.set(i, 'employmentType')
    else if (['bank name', 'bank_name', 'bank'].includes(h)) headerMap.set(i, 'bankName')
    else if (['bank account number', 'bank_account_number', 'account number', 'account_number', 'acct number'].includes(h)) headerMap.set(i, 'bankAccountNumber')
    else if (['bank account name', 'bank_account_name', 'account name', 'account_name', 'acct name'].includes(h)) headerMap.set(i, 'bankAccountName')
    else if (['tax id number', 'tax_id_number', 'tax id', 'tax_id', 'tin', 'ssn', 'national id'].includes(h)) headerMap.set(i, 'taxIdNumber')
    else if (['date of birth', 'date_of_birth', 'dob', 'birthdate', 'birth date', 'birthday'].includes(h)) headerMap.set(i, 'dateOfBirth')
    else if (['emergency contact name', 'emergency_contact_name', 'emergency contact', 'emergency name', 'ice name'].includes(h)) headerMap.set(i, 'emergencyContactName')
    else if (['emergency contact phone', 'emergency_contact_phone', 'emergency phone', 'ice phone'].includes(h)) headerMap.set(i, 'emergencyContactPhone')
  }

  // Validate required headers
  const hasName = [...headerMap.values()].includes('fullName')
  const hasEmail = [...headerMap.values()].includes('email')
  
  if (!hasName || !hasEmail) {
    const missing = []
    if (!hasName) missing.push('Full Name')
    if (!hasEmail) missing.push('Email')
    return {
      valid: [],
      errors: [{ row: 0, field: 'headers', message: `Missing required columns: ${missing.join(', ')}. Found: ${headers.join(', ')}` }],
      totalRows: lines.length - 1,
      validRows: 0,
    }
  }

  // Parse data rows
  const valid: CSVEmployeeRow[] = []
  const errors: Array<{ row: number; field: string; message: string }> = []
  const seenEmails = new Set<string>()

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    const raw: Record<string, unknown> = {}

    for (const [colIdx, fieldName] of headerMap.entries()) {
      const value = values[colIdx]?.trim()
      if (value) {
        if (fieldName === 'salary') {
          raw[fieldName] = parseFloat(value.replace(/[,$]/g, ''))
        } else {
          raw[fieldName] = value
        }
      }
    }

    // Validate row
    const result = employeeRowSchema.safeParse(raw)
    if (result.success) {
      // Check for duplicate emails
      const email = result.data.email.toLowerCase()
      if (seenEmails.has(email)) {
        errors.push({ row: i + 1, field: 'email', message: `Duplicate email: ${email}` })
      } else {
        seenEmails.add(email)
        valid.push({ ...result.data, email })
      }
    } else {
      for (const issue of result.error.issues) {
        errors.push({
          row: i + 1,
          field: issue.path.join('.') || 'unknown',
          message: issue.message,
        })
      }
    }
  }

  return {
    valid,
    errors,
    totalRows: lines.length - 1,
    validRows: valid.length,
  }
}

/**
 * Parse a single CSV line handling quoted fields with commas and newlines.
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"'
          i++ // skip escaped quote
        } else {
          inQuotes = false
        }
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ',') {
        result.push(current)
        current = ''
      } else {
        current += char
      }
    }
  }
  result.push(current)
  return result
}

/**
 * Generate a sample CSV template for download.
 */
export function generateCSVTemplate(): string {
  const header = 'Full Name,Email,Job Title,Department,Country,Level,Hire Date,Phone,Role,Manager Email,Location,Employment Type,Bank Name,Bank Account Number,Bank Account Name,Tax ID Number,Date of Birth,Emergency Contact Name,Emergency Contact Phone'
  const sample1 = 'John Smith,john.smith@temporuns.com,Software Engineer,Engineering,Kenya,Mid-Level,2025-01-15,+254712345678,employee,,Nairobi,full_time,Equity Bank,9876543210,John Smith,B987654321,1992-08-20,Mary Smith,+254711111111'
  const sample2 = 'Jane Doe,jane.doe@temporuns.com,HR Manager,Human Resources,Kenya,Senior Manager,2024-06-01,+254723456789,hrbp,,Nairobi,full_time,KCB Bank,1122334455,Jane Doe,C112233445,1988-03-10,Peter Doe,+254722222222'
  return [header, sample1, sample2].join('\n')
}
