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
  const header = 'Full Name,Email,Job Title,Department,Country,Phone,Hire Date,Role,Salary,Currency'
  const sample1 = 'Adaeze Okafor,adaeze@company.com,Software Engineer,Engineering,Nigeria,+234 801 234 5678,2025-01-15,employee,8000000,NGN'
  const sample2 = 'Kwame Asante,kwame@company.com,HR Manager,Human Resources,Ghana,+233 24 123 4567,2024-06-01,manager,180000,GHS'
  return [header, sample1, sample2].join('\n')
}
