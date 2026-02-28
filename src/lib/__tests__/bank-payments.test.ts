import { describe, it, expect } from 'vitest'
import {
  generateNIBSSFile,
  generateGhIPSSFile,
  generateKenyaEFTFile,
  generateACHFile,
  generateGenericCSV,
  generatePaymentFile,
  type PaymentInstruction,
} from '@/lib/payroll/bank-payments'

const sampleInstructions: PaymentInstruction[] = [
  {
    employeeId: 'emp-001',
    employeeName: 'Adaeze Okafor',
    bankName: 'First Bank',
    bankCode: '011',
    accountNumber: '0123456789',
    amount: 250000,
    currency: 'NGN',
    reference: 'SAL-2026-01-001',
  },
  {
    employeeId: 'emp-002',
    employeeName: 'Chidi Eze',
    bankName: 'GTBank',
    bankCode: '058',
    accountNumber: '0987654321',
    amount: 350000,
    currency: 'NGN',
    reference: 'SAL-2026-01-002',
  },
]

describe('Bank Payment File Generation', () => {
  describe('NIBSS (Nigeria)', () => {
    it('generates valid NIBSS format', () => {
      const result = generateNIBSSFile(sampleInstructions, '011', '1234567890', 'PAY-2026-01')
      expect(result.format).toBe('NIBSS')
      expect(result.transactionCount).toBe(2)
      expect(result.totalAmount).toBe(600000)
      expect(result.content).toContain('H,') // header
      expect(result.content).toContain('D,') // detail
      expect(result.content).toContain('T,') // trailer
      expect(result.filename).toContain('NIBSS')
      expect(result.checksum).toBeDefined()
    })

    it('includes all employee records', () => {
      const result = generateNIBSSFile(sampleInstructions, '011', '1234567890', 'PAY-2026-01')
      const lines = result.content.split('\n')
      expect(lines.length).toBe(4) // header + 2 details + trailer
    })
  })

  describe('GhIPSS (Ghana)', () => {
    it('generates valid GhIPSS format', () => {
      const result = generateGhIPSSFile(sampleInstructions, '060', '1234567890', 'PAY-GH-01')
      expect(result.format).toBe('GhIPSS')
      expect(result.transactionCount).toBe(2)
      expect(result.content).toContain('HDR,')
      expect(result.content).toContain('DTL,')
      expect(result.content).toContain('TRL,')
    })
  })

  describe('Kenya EFT', () => {
    it('generates valid Kenya EFT format', () => {
      const result = generateKenyaEFTFile(sampleInstructions, '001', '1234567890', 'PAY-KE-01')
      expect(result.format).toBe('Kenya-EFT')
      expect(result.content).toContain('H,')
      expect(result.content).toContain('D,')
      expect(result.content).toContain('T,')
      expect(result.content).toContain('KES')
    })
  })

  describe('ACH/NACHA (USA)', () => {
    it('generates valid NACHA format', () => {
      const result = generateACHFile(
        sampleInstructions,
        '1234567890',
        'TEMPO PAYROLL',
        '021000021',
        'PAY-US-01',
      )
      expect(result.format).toBe('ACH/NACHA')
      expect(result.filename).toContain('.ach')
      expect(result.content.startsWith('1')).toBe(true) // file header record type
      expect(result.content).toContain('PPD') // standard entry class
      expect(result.content).toContain('PAYROLL')
    })

    it('calculates correct total in cents', () => {
      const result = generateACHFile(
        sampleInstructions,
        '1234567890',
        'TEMPO PAYROLL',
        '021000021',
        'PAY-US-01',
      )
      expect(result.totalAmount).toBe(600000)
    })
  })

  describe('Generic CSV', () => {
    it('generates valid CSV with headers', () => {
      const result = generateGenericCSV(sampleInstructions, 'PAY-CSV-01')
      expect(result.format).toBe('CSV')
      expect(result.content).toContain('Employee ID')
      expect(result.content).toContain('Adaeze Okafor')
      expect(result.content).toContain('Chidi Eze')
      expect(result.mimeType).toBe('text/csv')
    })
  })

  describe('Auto-select by country', () => {
    it('selects NIBSS for Nigeria', () => {
      const result = generatePaymentFile('NG', sampleInstructions, '011', '1234567890', 'PAY-01')
      expect(result.format).toBe('NIBSS')
    })

    it('selects GhIPSS for Ghana', () => {
      const result = generatePaymentFile('GH', sampleInstructions, '060', '1234567890', 'PAY-01')
      expect(result.format).toBe('GhIPSS')
    })

    it('selects Kenya EFT for Kenya', () => {
      const result = generatePaymentFile('KE', sampleInstructions, '001', '1234567890', 'PAY-01')
      expect(result.format).toBe('Kenya-EFT')
    })

    it('selects ACH for USA', () => {
      const result = generatePaymentFile('US', sampleInstructions, '021000021', '1234567890', 'PAY-01', '1234567890', 'TEMPO')
      expect(result.format).toBe('ACH/NACHA')
    })

    it('falls back to CSV for unknown countries', () => {
      const result = generatePaymentFile('XX', sampleInstructions, '000', '0000000000', 'PAY-01')
      expect(result.format).toBe('CSV')
    })
  })

  describe('Edge cases', () => {
    it('handles empty instruction list', () => {
      const result = generateNIBSSFile([], '011', '1234567890', 'PAY-EMPTY')
      expect(result.transactionCount).toBe(0)
      expect(result.totalAmount).toBe(0)
    })

    it('handles single instruction', () => {
      const result = generateNIBSSFile([sampleInstructions[0]], '011', '1234567890', 'PAY-ONE')
      expect(result.transactionCount).toBe(1)
      expect(result.totalAmount).toBe(250000)
    })
  })
})
