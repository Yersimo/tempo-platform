import { describe, it, expect } from 'vitest'
import {
  calculateStatutoryDeductions,
  getStatutoryRequirements,
  getSupportedCountries,
  calculateTotalEmployerCost,
} from '@/lib/payroll/statutory-deductions'

describe('Statutory Deductions Engine', () => {
  describe('getSupportedCountries', () => {
    it('supports all 33 Ecobank countries', () => {
      const countries = getSupportedCountries()
      const ecobankCountries = ['NG', 'GH', 'KE', 'ZA', 'CI', 'SN', 'CM', 'TZ', 'UG', 'RW', 'CD', 'CG', 'GA', 'TG', 'BJ', 'BF', 'NE', 'ML', 'GW', 'TD', 'CF', 'GQ', 'MZ', 'ZM', 'ZW', 'SL', 'GN', 'GM', 'LR', 'CV', 'MR', 'ST', 'BI']
      for (const c of ecobankCountries) {
        expect(countries).toContain(c)
      }
    })
  })

  describe('Nigeria (NG)', () => {
    it('calculates all Nigerian statutory deductions', () => {
      const result = calculateStatutoryDeductions('NG', 5000000)
      expect(result.country).toBe('NG')
      expect(result.currency).toBe('NGN')
      expect(result.deductions.length).toBeGreaterThanOrEqual(4) // PFA, NHF, NHIS, ITF, NSITF
      expect(result.totalEmployeeDeductions).toBeGreaterThan(0)
      expect(result.totalEmployerContributions).toBeGreaterThan(0)
    })

    it('includes pension at 8% employee + 10% employer', () => {
      const result = calculateStatutoryDeductions('NG', 5000000)
      const pension = result.deductions.find(d => d.name.includes('Pension'))
      expect(pension).toBeDefined()
      expect(pension!.employeeAmount).toBeCloseTo(400000, -2) // 8% of 5M
      expect(pension!.employerAmount).toBeCloseTo(500000, -2) // 10% of 5M
    })

    it('includes NHF at 2.5% employee', () => {
      const result = calculateStatutoryDeductions('NG', 5000000)
      const nhf = result.deductions.find(d => d.name.includes('NHF'))
      expect(nhf).toBeDefined()
      expect(nhf!.employeeAmount).toBeCloseTo(125000, -2) // 2.5% of 5M
    })
  })

  describe('Ghana (GH)', () => {
    it('calculates SSNIT and tier 2 pension', () => {
      const result = calculateStatutoryDeductions('GH', 120000)
      expect(result.country).toBe('GH')
      expect(result.currency).toBe('GHS')
      const ssnit = result.deductions.find(d => d.name.includes('SSNIT'))
      expect(ssnit).toBeDefined()
      expect(ssnit!.employeeAmount).toBeCloseTo(6600, -2) // 5.5%
      expect(ssnit!.employerAmount).toBeCloseTo(15600, -2) // 13%
    })
  })

  describe('Kenya (KE)', () => {
    it('calculates NSSF with cap', () => {
      const result = calculateStatutoryDeductions('KE', 2400000)
      const nssf = result.deductions.find(d => d.name.includes('NSSF'))
      expect(nssf).toBeDefined()
      // Cap at 216,000 KES
      expect(nssf!.employeeAmount).toBeCloseTo(12960, -2) // 6% of 216K cap
    })

    it('includes housing levy at 1.5%', () => {
      const result = calculateStatutoryDeductions('KE', 2400000)
      const housing = result.deductions.find(d => d.name.includes('Housing'))
      expect(housing).toBeDefined()
      expect(housing!.employeeAmount).toBeCloseTo(36000, -2) // 1.5%
    })
  })

  describe('South Africa (ZA)', () => {
    it('calculates UIF with cap', () => {
      const result = calculateStatutoryDeductions('ZA', 600000)
      const uif = result.deductions.find(d => d.name.includes('UIF'))
      expect(uif).toBeDefined()
      // Cap at 177,120 ZAR
      expect(uif!.employeeAmount).toBeCloseTo(1771.2, -1)
    })
  })

  describe('Employer cost calculation', () => {
    it('calculates total employer cost for Nigeria', () => {
      const result = calculateTotalEmployerCost('NG', 5000000)
      expect(result.grossSalary).toBe(5000000)
      expect(result.employerContributions).toBeGreaterThan(0)
      expect(result.totalCost).toBeGreaterThan(5000000)
      expect(result.costMultiplier).toBeGreaterThan(1)
    })

    it('returns 1.0 multiplier for unsupported countries', () => {
      const result = calculateTotalEmployerCost('XX', 100000)
      expect(result.costMultiplier).toBe(1)
      expect(result.employerContributions).toBe(0)
    })
  })

  describe('All Ecobank countries smoke test', () => {
    const countries = getSupportedCountries()
    
    it.each(countries)('calculates deductions for %s without throwing', (country) => {
      const result = calculateStatutoryDeductions(country, 1000000)
      expect(result.country).toBe(country)
      expect(result.totalEmployeeDeductions).toBeGreaterThanOrEqual(0)
      expect(result.totalEmployerContributions).toBeGreaterThanOrEqual(0)
      expect(result.totalStatutoryCost).toBe(
        result.totalEmployeeDeductions + result.totalEmployerContributions
      )
    })
  })
})
