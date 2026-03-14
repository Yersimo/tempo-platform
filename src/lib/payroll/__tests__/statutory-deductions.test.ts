import { describe, it, expect } from 'vitest'
import {
  calculateStatutoryDeductions,
  getStatutoryRequirements,
  getSupportedCountries,
  calculateTotalEmployerCost,
} from '../statutory-deductions'

describe('calculateStatutoryDeductions', () => {
  // ─── Ghana ──────────────────────────────────────────────────────────
  describe('Ghana (GH)', () => {
    it('calculates SSNIT, NHIS, and Tier 2 deductions', async () => {
      const result = await calculateStatutoryDeductions('GH', 120_000) // GHS 120k/year
      expect(result.country).toBe('GH')
      expect(result.currency).toBe('GHS')
      expect(result.grossSalary).toBe(120_000)
      expect(result.deductions).toHaveLength(3)

      // SSNIT: employee 5.5%, employer 13%
      const ssnit = result.deductions.find(d => d.name.includes('SSNIT'))!
      expect(ssnit.employeeAmount).toBe(6600)  // 120000 * 0.055
      expect(ssnit.employerAmount).toBe(15600)  // 120000 * 0.13

      // NHIS: employer-only 2.5%
      const nhis = result.deductions.find(d => d.name.includes('NHIS'))!
      expect(nhis.employeeAmount).toBe(0)
      expect(nhis.employerAmount).toBe(3000)  // 120000 * 0.025

      // Tier 2: employee 5%
      const tier2 = result.deductions.find(d => d.name.includes('Tier 2'))!
      expect(tier2.employeeAmount).toBe(6000) // 120000 * 0.05
      expect(tier2.employerAmount).toBe(0)
    })

    it('sums totals correctly', async () => {
      const result = await calculateStatutoryDeductions('GH', 120_000)
      // Employee: 5.5% + 0% + 5% = 10.5% = 12600
      expect(result.totalEmployeeDeductions).toBe(12600)
      // Employer: 13% + 2.5% + 0% = 15.5% = 18600
      expect(result.totalEmployerContributions).toBe(18600)
      expect(result.totalStatutoryCost).toBe(31200)
    })
  })

  // ─── Nigeria ────────────────────────────────────────────────────────
  describe('Nigeria (NG)', () => {
    it('calculates 5 deduction types', async () => {
      const result = await calculateStatutoryDeductions('NG', 10_000_000) // NGN 10M/year
      expect(result.deductions).toHaveLength(5)

      const pension = result.deductions.find(d => d.name.includes('Pension'))!
      expect(pension.employeeAmount).toBe(800_000)  // 8%
      expect(pension.employerAmount).toBe(1_000_000) // 10%

      const nhf = result.deductions.find(d => d.name.includes('NHF'))!
      expect(nhf.employeeAmount).toBe(250_000) // 2.5%
    })
  })

  // ─── Kenya ──────────────────────────────────────────────────────────
  describe('Kenya (KE)', () => {
    it('applies NSSF cap at KES 216,000', async () => {
      const result = await calculateStatutoryDeductions('KE', 500_000) // KES 500k/year
      const nssf = result.deductions.find(d => d.name.includes('NSSF'))!
      // Capped at 216,000 * 6% = 12,960
      expect(nssf.employeeAmount).toBe(12960)
      expect(nssf.employerAmount).toBe(12960)
    })

    it('uses salary when below cap', async () => {
      const result = await calculateStatutoryDeductions('KE', 100_000)
      const nssf = result.deductions.find(d => d.name.includes('NSSF'))!
      expect(nssf.employeeAmount).toBe(6000) // 100000 * 0.06
    })

    it('applies NITA fixed amount', async () => {
      const result = await calculateStatutoryDeductions('KE', 500_000)
      const nita = result.deductions.find(d => d.name.includes('NITA'))!
      // NITA has fixedAmount of 50, employer only
      expect(nita.employeeAmount).toBe(0)
      expect(nita.employerAmount).toBe(50)
    })

    it('calculates NHIF at 2.5%', async () => {
      const result = await calculateStatutoryDeductions('KE', 500_000)
      const nhif = result.deductions.find(d => d.name.includes('NHIF'))!
      expect(nhif.employeeAmount).toBe(12500) // 500000 * 0.025
      expect(nhif.employerAmount).toBe(0)
    })
  })

  // ─── South Africa ──────────────────────────────────────────────────
  describe('South Africa (ZA)', () => {
    it('applies UIF cap at ZAR 177,120', async () => {
      const result = await calculateStatutoryDeductions('ZA', 500_000)
      const uif = result.deductions.find(d => d.name.includes('UIF'))!
      expect(uif.employeeAmount).toBe(1771.2) // 177120 * 0.01
      expect(uif.employerAmount).toBe(1771.2)
    })

    it('includes optional Retirement Fund by default', async () => {
      const result = await calculateStatutoryDeductions('ZA', 500_000)
      expect(result.deductions).toHaveLength(3)
      const retirement = result.deductions.find(d => d.name.includes('Retirement'))!
      expect(retirement).toBeDefined()
    })

    it('excludes optional deductions when includeOptional=false', async () => {
      const result = await calculateStatutoryDeductions('ZA', 500_000, { includeOptional: false })
      expect(result.deductions).toHaveLength(2) // UIF + SDL only
      expect(result.deductions.find(d => d.name.includes('Retirement'))).toBeUndefined()
    })
  })

  // ─── Employer-only mode ────────────────────────────────────────────
  describe('employer-only mode', () => {
    it('zeroes out employee amounts', async () => {
      const result = await calculateStatutoryDeductions('GH', 120_000, { employerOnly: true })
      for (const d of result.deductions) {
        expect(d.employeeAmount).toBe(0)
      }
      expect(result.totalEmployeeDeductions).toBe(0)
      expect(result.totalEmployerContributions).toBeGreaterThan(0)
    })
  })

  // ─── Unknown country ──────────────────────────────────────────────
  describe('unsupported country', () => {
    it('returns empty deductions for unknown country', async () => {
      const result = await calculateStatutoryDeductions('XX', 100_000)
      expect(result.deductions).toHaveLength(0)
      expect(result.totalEmployeeDeductions).toBe(0)
      expect(result.totalEmployerContributions).toBe(0)
      expect(result.currency).toBe('USD')
    })
  })
})

describe('getStatutoryRequirements', () => {
  it('returns deductions array for known country', () => {
    const reqs = getStatutoryRequirements('GH')
    expect(reqs.length).toBeGreaterThan(0)
    expect(reqs[0]).toHaveProperty('name')
    expect(reqs[0]).toHaveProperty('employeeRate')
  })

  it('returns empty array for unknown country', () => {
    expect(getStatutoryRequirements('XX')).toEqual([])
  })
})

describe('getSupportedCountries', () => {
  it('returns at least 33 countries', () => {
    const countries = getSupportedCountries()
    expect(countries.length).toBeGreaterThanOrEqual(33)
    expect(countries).toContain('GH')
    expect(countries).toContain('NG')
    expect(countries).toContain('KE')
    expect(countries).toContain('ZA')
  })
})

describe('calculateTotalEmployerCost', () => {
  it('returns total cost above gross salary', async () => {
    const result = await calculateTotalEmployerCost('GH', 120_000)
    expect(result.grossSalary).toBe(120_000)
    expect(result.employerContributions).toBeGreaterThan(0)
    expect(result.totalCost).toBe(120_000 + result.employerContributions)
    expect(result.costMultiplier).toBeGreaterThan(1)
  })

  it('returns multiplier of 1 for unknown country', async () => {
    const result = await calculateTotalEmployerCost('XX', 100_000)
    expect(result.costMultiplier).toBe(1)
    expect(result.totalCost).toBe(100_000)
  })
})
