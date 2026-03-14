import { describe, it, expect } from 'vitest'
import {
  autoDetectMappings,
  validateMigrationData,
  parseCSV,
  generateMigrationTemplate,
  MIGRATION_COLUMNS,
} from '../data-migration'

describe('parseCSV', () => {
  it('parses headers and data rows', () => {
    const csv = 'Name,Email,Salary\nKwame Asante,kwame@test.com,5000\nNgozi Okafor,ngozi@test.com,8000'
    const { headers, rows } = parseCSV(csv)
    expect(headers).toEqual(['Name', 'Email', 'Salary'])
    expect(rows).toHaveLength(2)
    expect(rows[0]['Name']).toBe('Kwame Asante')
    expect(rows[1]['Email']).toBe('ngozi@test.com')
  })

  it('handles quoted fields with commas', () => {
    const csv = 'Name,Address\n"Asante, Kwame","123 Main St, Accra"'
    const { rows } = parseCSV(csv)
    expect(rows[0]['Name']).toBe('Asante, Kwame')
    expect(rows[0]['Address']).toBe('123 Main St, Accra')
  })

  it('returns empty for empty input', () => {
    const { headers, rows } = parseCSV('')
    expect(headers).toEqual([])
    expect(rows).toEqual([])
  })

  it('handles single header row with no data', () => {
    const { headers, rows } = parseCSV('Name,Email')
    expect(headers).toEqual(['Name', 'Email'])
    expect(rows).toEqual([])
  })
})

describe('autoDetectMappings', () => {
  it('maps standard header names', () => {
    const mappings = autoDetectMappings(['Name', 'Email', 'Salary', 'Department', 'Country'])
    expect(mappings.find(m => m.targetColumn === 'full_name')).toBeDefined()
    expect(mappings.find(m => m.targetColumn === 'email')).toBeDefined()
    expect(mappings.find(m => m.targetColumn === 'monthly_salary')).toBeDefined()
    expect(mappings.find(m => m.targetColumn === 'department')).toBeDefined()
    expect(mappings.find(m => m.targetColumn === 'country')).toBeDefined()
  })

  it('maps variant header names', () => {
    const mappings = autoDetectMappings([
      'Employee Name', 'E-mail', 'Basic Salary', 'Hire Date', 'SSNIT Number',
    ])
    expect(mappings.find(m => m.targetColumn === 'full_name')).toBeDefined()
    expect(mappings.find(m => m.targetColumn === 'email')).toBeDefined()
    expect(mappings.find(m => m.targetColumn === 'monthly_salary')).toBeDefined()
    expect(mappings.find(m => m.targetColumn === 'start_date')).toBeDefined()
    expect(mappings.find(m => m.targetColumn === 'pension_id')).toBeDefined()
  })

  it('handles EMP_ID, Dept, DOB patterns', () => {
    const mappings = autoDetectMappings(['EMP_ID', 'Dept', 'DOB', 'Phone'])
    expect(mappings.find(m => m.targetColumn === 'employee_id')).toBeDefined()
    expect(mappings.find(m => m.targetColumn === 'department')).toBeDefined()
    expect(mappings.find(m => m.targetColumn === 'date_of_birth')).toBeDefined()
    expect(mappings.find(m => m.targetColumn === 'phone')).toBeDefined()
  })
})

describe('validateMigrationData', () => {
  const baseMappings = [
    { sourceColumn: 'Name', targetColumn: 'full_name' },
    { sourceColumn: 'Email', targetColumn: 'email' },
    { sourceColumn: 'Salary', targetColumn: 'monthly_salary' },
    { sourceColumn: 'Country', targetColumn: 'country' },
  ]

  it('validates correct rows', () => {
    const rows = [
      { Name: 'Kwame Asante', Email: 'kwame@test.com', Salary: '5000', Country: 'Ghana' },
      { Name: 'Ngozi Okafor', Email: 'ngozi@test.com', Salary: '8000', Country: 'Nigeria' },
    ]
    const result = validateMigrationData(rows, baseMappings)
    expect(result.totalRows).toBe(2)
    expect(result.validRows).toBe(2)
    expect(result.errorRows).toBe(0)
  })

  it('flags missing required fields', () => {
    const rows = [
      { Name: '', Email: 'kwame@test.com', Salary: '5000', Country: 'Ghana' },
    ]
    const result = validateMigrationData(rows, baseMappings)
    expect(result.errorRows).toBe(1)
    expect(result.errors.some(e => e.column === 'full_name')).toBe(true)
  })

  it('validates email format', () => {
    const rows = [
      { Name: 'Test', Email: 'not-an-email', Salary: '5000', Country: 'GH' },
    ]
    const result = validateMigrationData(rows, baseMappings)
    expect(result.errors.some(e => e.column === 'email' && e.error.includes('email'))).toBe(true)
  })

  it('detects duplicate emails within file', () => {
    const rows = [
      { Name: 'A', Email: 'same@test.com', Salary: '5000', Country: 'GH' },
      { Name: 'B', Email: 'same@test.com', Salary: '6000', Country: 'GH' },
    ]
    const result = validateMigrationData(rows, baseMappings)
    expect(result.errors.some(e => e.error.includes('Duplicate'))).toBe(true)
  })

  it('detects existing email duplicates', () => {
    const rows = [
      { Name: 'A', Email: 'existing@company.com', Salary: '5000', Country: 'GH' },
    ]
    const result = validateMigrationData(rows, baseMappings, ['existing@company.com'])
    expect(result.duplicates).toBe(1)
  })

  it('parses currency values with symbols and commas', () => {
    const rows = [
      { Name: 'Test', Email: 'a@b.com', Salary: 'GHS 5,000.00', Country: 'GH' },
    ]
    const result = validateMigrationData(rows, baseMappings)
    expect(result.validRows).toBe(1)
    // 5000 * 100 = 500000 cents
    expect(result.preview[0]?.monthly_salary).toBe(500_000)
  })

  it('normalizes country names', () => {
    const rows = [
      { Name: 'Test', Email: 'a@b.com', Salary: '5000', Country: 'ghana' },
    ]
    const result = validateMigrationData(rows, baseMappings)
    expect(result.preview[0]?.country).toBe('GH')
  })

  it('flags unrecognized countries', () => {
    const rows = [
      { Name: 'Test', Email: 'a@b.com', Salary: '5000', Country: 'Atlantis' },
    ]
    const result = validateMigrationData(rows, baseMappings)
    expect(result.errors.some(e => e.column === 'country')).toBe(true)
  })

  it('limits preview to 5 rows', () => {
    const rows = Array.from({ length: 10 }, (_, i) => ({
      Name: `Employee ${i}`,
      Email: `emp${i}@test.com`,
      Salary: '5000',
      Country: 'GH',
    }))
    const result = validateMigrationData(rows, baseMappings)
    expect(result.preview).toHaveLength(5)
  })
})

describe('generateMigrationTemplate', () => {
  it('generates a valid CSV template', () => {
    const csv = generateMigrationTemplate()
    const lines = csv.split('\n')
    expect(lines.length).toBe(3) // header + 2 sample rows
    expect(lines[0]).toContain('Full Name')
    expect(lines[0]).toContain('Email Address')
    expect(lines[0]).toContain('Monthly Salary')
  })
})

describe('MIGRATION_COLUMNS', () => {
  it('has required columns for name, email, salary, country', () => {
    const required = MIGRATION_COLUMNS.filter(c => c.required)
    const requiredKeys = required.map(c => c.key)
    expect(requiredKeys).toContain('full_name')
    expect(requiredKeys).toContain('email')
    expect(requiredKeys).toContain('monthly_salary')
    expect(requiredKeys).toContain('country')
  })
})
