import { describe, it, expect } from 'vitest'
import { parseEmployeeCSV, generateCSVTemplate } from '@/lib/onboarding/csv-import'

describe('CSV Employee Import', () => {
  describe('parseEmployeeCSV', () => {
    it('parses valid CSV with standard headers', () => {
      const csv = `Full Name,Email,Job Title,Department,Country
Adaeze Okafor,adaeze@company.com,Engineer,Engineering,Nigeria
Kwame Asante,kwame@company.com,Manager,HR,Ghana`

      const result = parseEmployeeCSV(csv)
      expect(result.validRows).toBe(2)
      expect(result.errors).toHaveLength(0)
      expect(result.valid[0].fullName).toBe('Adaeze Okafor')
      expect(result.valid[0].email).toBe('adaeze@company.com')
    })

    it('handles flexible header names', () => {
      const csv = `Employee Name,Email Address,Position,Dept
John Doe,john@test.com,Developer,Tech`

      const result = parseEmployeeCSV(csv)
      expect(result.validRows).toBe(1)
      expect(result.valid[0].fullName).toBe('John Doe')
      expect(result.valid[0].jobTitle).toBe('Developer')
    })

    it('rejects rows with missing email', () => {
      const csv = `Full Name,Email
Valid User,valid@test.com
No Email,`

      const result = parseEmployeeCSV(csv)
      expect(result.validRows).toBe(1)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('detects duplicate emails', () => {
      const csv = `Full Name,Email
User One,same@test.com
User Two,same@test.com`

      const result = parseEmployeeCSV(csv)
      expect(result.validRows).toBe(1)
      expect(result.errors.some(e => e.message.includes('Duplicate'))).toBe(true)
    })

    it('handles quoted fields with commas', () => {
      const csv = `Full Name,Email,Job Title
"Okafor, Adaeze",adaeze@test.com,"Senior Engineer, Platform"`

      const result = parseEmployeeCSV(csv)
      expect(result.validRows).toBe(1)
      expect(result.valid[0].fullName).toBe('Okafor, Adaeze')
    })

    it('rejects CSV without required headers', () => {
      const csv = `Name,Title
John,Engineer`

      const result = parseEmployeeCSV(csv)
      // 'Name' maps to fullName, but no Email column
      expect(result.errors.some(e => e.message.includes('Missing required columns'))).toBe(true)
    })

    it('handles salary as numeric', () => {
      const csv = `Full Name,Email,Salary,Currency
Jane Doe,jane@test.com,8000000,NGN`

      const result = parseEmployeeCSV(csv)
      expect(result.validRows).toBe(1)
      expect(result.valid[0].salary).toBe(8000000)
      expect(result.valid[0].currency).toBe('NGN')
    })

    it('strips dollar signs and commas from salary', () => {
      const csv = `Full Name,Email,Salary
Jane Doe,jane@test.com,"$120,000"`

      const result = parseEmployeeCSV(csv)
      expect(result.validRows).toBe(1)
      expect(result.valid[0].salary).toBe(120000)
    })

    it('rejects empty CSV', () => {
      const result = parseEmployeeCSV('')
      expect(result.validRows).toBe(0)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('validates role field', () => {
      const csv = `Full Name,Email,Role
Admin User,admin@test.com,admin
Bad Role,bad@test.com,superuser`

      const result = parseEmployeeCSV(csv)
      expect(result.validRows).toBe(1)
      expect(result.valid[0].role).toBe('admin')
      expect(result.errors.some(e => e.row === 3)).toBe(true)
    })
  })

  describe('generateCSVTemplate', () => {
    it('generates template with correct headers', () => {
      const template = generateCSVTemplate()
      expect(template).toContain('Full Name')
      expect(template).toContain('Email')
      expect(template).toContain('Job Title')
      expect(template).toContain('Department')
      expect(template).toContain('Country')
      expect(template).toContain('Salary')
      expect(template).toContain('Currency')
    })

    it('includes sample data rows', () => {
      const template = generateCSVTemplate()
      const lines = template.split('\n')
      expect(lines.length).toBeGreaterThanOrEqual(3)
    })
  })
})
