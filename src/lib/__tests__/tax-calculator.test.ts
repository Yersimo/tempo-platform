import { describe, it, expect } from 'vitest'
import { calculateTax } from '../tax-calculator'
import type { SupportedCountry } from '../tax-calculator'

describe('Tax Calculator', () => {
  // ─── US Tax ──────────────────────────────────────────────────────
  describe('US Tax', () => {
    it('calculates federal tax for single filer', () => {
      const result = calculateTax('US', 100000, { filingStatus: 'single' })
      expect(result.country).toBe('US')
      expect(result.currency).toBe('USD')
      expect(result.grossSalary).toBe(100000)
      expect(result.federalTax).toBeGreaterThan(0)
      expect(result.federalTax).toBeLessThan(result.grossSalary)
      expect(result.socialSecurity).toBeGreaterThan(0)
      expect(result.medicare).toBeGreaterThan(0)
      expect(result.netPay).toBe(result.grossSalary - result.totalTax)
      expect(result.effectiveTaxRate).toBeGreaterThan(0)
      expect(result.effectiveTaxRate).toBeLessThan(50)
    })

    it('calculates married joint filing correctly', () => {
      const single = calculateTax('US', 100000, { filingStatus: 'single' })
      const joint = calculateTax('US', 100000, { filingStatus: 'married_joint' })
      // Married joint has wider brackets, so less federal tax
      expect(joint.federalTax).toBeLessThan(single.federalTax)
    })

    it('applies California state tax', () => {
      const noState = calculateTax('US', 100000, { filingStatus: 'single' })
      const withState = calculateTax('US', 100000, { filingStatus: 'single', state: 'CA' })
      expect(withState.stateOrProvincialTax).toBeGreaterThan(0)
      expect(withState.totalTax).toBeGreaterThan(noState.totalTax)
    })

    it('handles zero-tax states (TX, FL, WA)', () => {
      const tx = calculateTax('US', 100000, { state: 'TX' })
      expect(tx.stateOrProvincialTax).toBe(0)
      const fl = calculateTax('US', 100000, { state: 'FL' })
      expect(fl.stateOrProvincialTax).toBe(0)
    })

    it('caps Social Security at wage base', () => {
      const high = calculateTax('US', 500000)
      // SS should be capped at 168600 * 6.2%
      expect(high.socialSecurity).toBeCloseTo(168600 * 0.062, 0)
    })

    it('applies additional Medicare tax above $200K', () => {
      const below = calculateTax('US', 150000)
      const above = calculateTax('US', 300000)
      const baseMedicare200k = 200000 * 0.0145
      const extraMedicare = (300000 - 200000) * 0.009
      expect(above.medicare).toBeGreaterThan(baseMedicare200k + extraMedicare - 1)
    })

    it('handles zero salary', () => {
      const result = calculateTax('US', 0)
      expect(result.federalTax).toBe(0)
      expect(result.totalTax).toBe(0)
      expect(result.netPay).toBe(0)
      expect(result.effectiveTaxRate).toBe(0)
    })
  })

  // ─── UK Tax ──────────────────────────────────────────────────────
  describe('UK Tax', () => {
    it('calculates income tax with personal allowance', () => {
      const result = calculateTax('UK', 50000)
      expect(result.country).toBe('UK')
      expect(result.currency).toBe('GBP')
      expect(result.federalTax).toBeGreaterThan(0)
      expect(result.socialSecurity).toBeGreaterThan(0) // NI
      expect(result.pension).toBeGreaterThan(0)
    })

    it('reduces personal allowance above £100K', () => {
      const below = calculateTax('UK', 90000)
      const above = calculateTax('UK', 130000)
      // Above 100K, allowance tapers — so effective rate increases
      const rateDiff = above.effectiveTaxRate - below.effectiveTaxRate
      expect(rateDiff).toBeGreaterThan(0)
    })

    it('applies pension contribution', () => {
      const result = calculateTax('UK', 80000, { pensionContributionRate: 0.08 })
      expect(result.pension).toBeCloseTo(80000 * 0.08, 0)
    })
  })

  // ─── Germany Tax ──────────────────────────────────────────────────
  describe('Germany Tax', () => {
    it('calculates income tax with basic exemption', () => {
      const lowIncome = calculateTax('DE', 10000)
      expect(lowIncome.federalTax).toBe(0) // Below exemption

      const medIncome = calculateTax('DE', 50000)
      expect(medIncome.federalTax).toBeGreaterThan(0)
      expect(medIncome.currency).toBe('EUR')
    })

    it('applies solidarity surcharge above threshold', () => {
      const result = calculateTax('DE', 100000)
      expect(result.additionalTaxes.solidaritySurcharge).toBeGreaterThan(0)
    })

    it('calculates social insurance components', () => {
      const result = calculateTax('DE', 60000)
      expect(result.additionalTaxes.healthInsurance).toBeGreaterThan(0)
      expect(result.additionalTaxes.nursingCare).toBeGreaterThan(0)
      expect(result.additionalTaxes.unemployment).toBeGreaterThan(0)
      expect(result.pension).toBeGreaterThan(0)
    })
  })

  // ─── France Tax ──────────────────────────────────────────────────
  describe('France Tax', () => {
    it('calculates income tax correctly', () => {
      const result = calculateTax('FR', 60000)
      expect(result.country).toBe('FR')
      expect(result.currency).toBe('EUR')
      expect(result.federalTax).toBeGreaterThan(0)
      expect(result.additionalTaxes.csgCrds).toBeGreaterThan(0)
    })

    it('applies pension contribution', () => {
      const result = calculateTax('FR', 40000)
      expect(result.pension).toBeGreaterThan(0)
    })
  })

  // ─── Canada Tax ──────────────────────────────────────────────────
  describe('Canada Tax', () => {
    it('calculates federal and provincial tax', () => {
      const result = calculateTax('CA', 80000, { province: 'ON' })
      expect(result.country).toBe('CA')
      expect(result.currency).toBe('CAD')
      expect(result.federalTax).toBeGreaterThan(0)
      expect(result.stateOrProvincialTax).toBeGreaterThan(0)
    })

    it('calculates CPP and EI', () => {
      const result = calculateTax('CA', 60000)
      expect(result.additionalTaxes.cpp).toBeGreaterThan(0)
      expect(result.additionalTaxes.ei).toBeGreaterThan(0)
    })

    it('handles different provinces', () => {
      const on = calculateTax('CA', 80000, { province: 'ON' })
      const ab = calculateTax('CA', 80000, { province: 'AB' })
      // Both provinces should compute valid provincial tax
      expect(on.stateOrProvincialTax).toBeGreaterThan(0)
      expect(ab.stateOrProvincialTax).toBeGreaterThan(0)
      // Alberta flat 10% is actually higher than Ontario graduated (5.05%/9.15%) at $80K
      expect(ab.stateOrProvincialTax).not.toBe(on.stateOrProvincialTax)
    })
  })

  // ─── Australia Tax ──────────────────────────────────────────────
  describe('Australia Tax', () => {
    it('has tax-free threshold of $18,200', () => {
      const lowIncome = calculateTax('AU', 15000)
      expect(lowIncome.federalTax).toBe(0)

      const medIncome = calculateTax('AU', 50000)
      expect(medIncome.federalTax).toBeGreaterThan(0)
    })

    it('applies Medicare levy', () => {
      const result = calculateTax('AU', 80000)
      expect(result.medicare).toBeGreaterThan(0)
      expect(result.currency).toBe('AUD')
    })

    it('calculates superannuation', () => {
      const result = calculateTax('AU', 80000)
      expect(result.pension).toBeCloseTo(80000 * 0.115, 0)
    })
  })

  // ─── Cross-Country Validation ──────────────────────────────────
  describe('Cross-Country', () => {
    it('returns correct currency for each country', () => {
      const currencies: Record<string, string> = {
        US: 'USD', UK: 'GBP', DE: 'EUR', FR: 'EUR', CA: 'CAD', AU: 'AUD',
      }
      for (const [country, currency] of Object.entries(currencies)) {
        const result = calculateTax(country as SupportedCountry, 50000)
        expect(result.currency).toBe(currency)
      }
    })

    it('net pay + total tax = gross salary for all countries', () => {
      const countries: SupportedCountry[] = ['US', 'UK', 'DE', 'FR', 'CA', 'AU']
      for (const country of countries) {
        const result = calculateTax(country, 75000)
        expect(result.netPay + result.totalTax).toBeCloseTo(result.grossSalary, 0)
      }
    })

    it('effective tax rate is between 0 and 100 for all countries', () => {
      const countries: SupportedCountry[] = ['US', 'UK', 'DE', 'FR', 'CA', 'AU']
      for (const country of countries) {
        const result = calculateTax(country, 100000)
        expect(result.effectiveTaxRate).toBeGreaterThanOrEqual(0)
        expect(result.effectiveTaxRate).toBeLessThanOrEqual(100)
      }
    })

    it('higher salary generally means higher effective tax rate', () => {
      const countries: SupportedCountry[] = ['US', 'UK', 'DE', 'FR', 'CA', 'AU']
      for (const country of countries) {
        const low = calculateTax(country, 30000)
        const high = calculateTax(country, 200000)
        expect(high.effectiveTaxRate).toBeGreaterThanOrEqual(low.effectiveTaxRate)
      }
    })
  })
})
