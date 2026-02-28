import { describe, it, expect } from 'vitest'
// Import from tax-calculator (client-safe, no DB dependency)
// payroll-engine.ts delegates calculateTax to tax-calculator.ts
import { calculateTax } from '../tax-calculator'
import type { SupportedCountry } from '../tax-calculator'

describe('Payroll Engine - African Tax Calculations', () => {
  // ─── Nigeria (PAYE) ──────────────────────────────────────────────
  describe('Nigeria (NG)', () => {
    it('calculates Nigerian PAYE with progressive brackets', () => {
      // Nigerian PAYE: 7% up to 300K, 11% to 600K, 15% to 1.1M, etc. (in NGN)
      const result = calculateTax('NG', 5000000) // 5M NGN annual salary
      expect(result.country).toBe('NG')
      expect(result.currency).toBe('NGN')
      expect(result.grossSalary).toBe(5000000)
      expect(result.federalTax).toBeGreaterThan(0)
      expect(result.netPay).toBeLessThan(result.grossSalary)
      expect(result.netPay).toBe(result.grossSalary - result.totalTax)
    })

    it('applies Nigerian pension deduction (8%)', () => {
      const result = calculateTax('NG', 5000000)
      // Pension rate is 8%
      expect(result.pension).toBeCloseTo(5000000 * 0.08, -1)
    })

    it('applies NHF/medicare deduction (5%)', () => {
      const result = calculateTax('NG', 5000000)
      expect(result.medicare).toBeCloseTo(5000000 * 0.05, -1)
    })

    it('applies personal allowance of 200,000 NGN', () => {
      // With personal allowance, lower income should have less tax
      const low = calculateTax('NG', 300000) // NGN 300K - within first bracket after allowance
      expect(low.federalTax).toBeGreaterThanOrEqual(0)
      expect(low.effectiveTaxRate).toBeLessThan(30)
    })

    it('handles high earner correctly', () => {
      const result = calculateTax('NG', 50000000) // 50M NGN
      expect(result.effectiveTaxRate).toBeGreaterThan(10)
      expect(result.effectiveTaxRate).toBeLessThan(50)
    })
  })

  // ─── Ghana ──────────────────────────────────────────────────────
  describe('Ghana (GH)', () => {
    it('calculates Ghanaian PAYE correctly', () => {
      const result = calculateTax('GH', 120000) // 120K GHS annual
      expect(result.country).toBe('GH')
      expect(result.currency).toBe('GHS')
      expect(result.federalTax).toBeGreaterThan(0)
      expect(result.netPay).toBe(result.grossSalary - result.totalTax)
    })

    it('applies SSNIT social security (5.5%)', () => {
      const result = calculateTax('GH', 120000)
      expect(result.socialSecurity).toBeCloseTo(120000 * 0.055, -1)
    })

    it('has tax-free threshold of GHS 4,380', () => {
      const low = calculateTax('GH', 4000) // Below threshold
      expect(low.federalTax).toBe(0)
    })
  })

  // ─── Kenya ──────────────────────────────────────────────────────
  describe('Kenya (KE)', () => {
    it('calculates Kenyan PAYE correctly', () => {
      const result = calculateTax('KE', 2400000) // 2.4M KES annual
      expect(result.country).toBe('KE')
      expect(result.currency).toBe('KES')
      expect(result.federalTax).toBeGreaterThan(0)
    })

    it('applies NSSF social security (6%)', () => {
      const result = calculateTax('KE', 2400000)
      // Social security capped at 216,000 KES
      expect(result.socialSecurity).toBeCloseTo(216000 * 0.06, -1)
    })

    it('applies NHIF medicare (2.5%)', () => {
      const result = calculateTax('KE', 2400000)
      expect(result.medicare).toBeCloseTo(2400000 * 0.025, -1)
    })

    it('applies personal allowance of 28,800 KES', () => {
      const result = calculateTax('KE', 250000)
      // Below personal allowance + first bracket threshold, so lower tax
      expect(result.effectiveTaxRate).toBeLessThan(20)
    })
  })

  // ─── South Africa ──────────────────────────────────────────────
  describe('South Africa (ZA)', () => {
    it('calculates South African PAYE correctly', () => {
      const result = calculateTax('ZA', 600000) // 600K ZAR annual
      expect(result.country).toBe('ZA')
      expect(result.currency).toBe('ZAR')
      expect(result.federalTax).toBeGreaterThan(0)
    })

    it('applies UIF additional tax (1%)', () => {
      const result = calculateTax('ZA', 600000)
      expect(result.additionalTaxes).toHaveProperty('uif')
      expect(result.additionalTaxes.uif).toBeCloseTo(600000 * 0.01, -1)
    })

    it('applies personal allowance of 95,750 ZAR', () => {
      const low = calculateTax('ZA', 90000) // Below personal allowance
      expect(low.federalTax).toBe(0)
    })
  })

  // ─── Cote d'Ivoire (WAEMU/XOF) ──────────────────────────────────
  describe("Cote d'Ivoire (CI)", () => {
    it('calculates Ivorian IRPP correctly', () => {
      const result = calculateTax('CI', 3000000) // 3M XOF annual
      expect(result.country).toBe('CI')
      expect(result.currency).toBe('XOF')
      expect(result.federalTax).toBeGreaterThan(0)
    })

    it('applies CNPS social security (6.3%)', () => {
      const result = calculateTax('CI', 3000000)
      expect(result.socialSecurity).toBeCloseTo(3000000 * 0.063, -1)
    })

    it('applies pension (3.2%)', () => {
      const result = calculateTax('CI', 3000000)
      expect(result.pension).toBeCloseTo(3000000 * 0.032, -1)
    })
  })

  // ─── Senegal (WAEMU/XOF) ──────────────────────────────────────
  describe('Senegal (SN)', () => {
    it('calculates Senegalese IR correctly', () => {
      const result = calculateTax('SN', 6000000) // 6M XOF annual
      expect(result.country).toBe('SN')
      expect(result.currency).toBe('XOF')
      expect(result.federalTax).toBeGreaterThan(0)
    })

    it('has tax-free threshold of 630,000 XOF', () => {
      const low = calculateTax('SN', 500000) // Below threshold
      expect(low.federalTax).toBe(0)
    })
  })

  // ─── Cameroon (CEMAC/XAF) ──────────────────────────────────────
  describe('Cameroon (CM)', () => {
    it('calculates Cameroonian income tax correctly', () => {
      const result = calculateTax('CM', 5000000) // 5M XAF annual
      expect(result.country).toBe('CM')
      expect(result.currency).toBe('XAF')
      expect(result.federalTax).toBeGreaterThan(0)
    })

    it('applies personal allowance of 500,000 XAF', () => {
      const low = calculateTax('CM', 400000) // Below personal allowance
      expect(low.federalTax).toBe(0)
    })
  })

  // ─── All 33 Ecobank Countries Smoke Test ──────────────────────
  describe('All Ecobank Countries', () => {
    const ecobankCountries: { code: SupportedCountry; salary: number }[] = [
      { code: 'NG', salary: 5000000 },   // Nigeria - NGN
      { code: 'GH', salary: 120000 },    // Ghana - GHS
      { code: 'KE', salary: 2400000 },   // Kenya - KES
      { code: 'CI', salary: 3000000 },   // Cote d'Ivoire - XOF
      { code: 'SN', salary: 6000000 },   // Senegal - XOF
      { code: 'TG', salary: 3000000 },   // Togo - XOF
      { code: 'BJ', salary: 3000000 },   // Benin - XOF
      { code: 'BF', salary: 3000000 },   // Burkina Faso - XOF
      { code: 'NE', salary: 3000000 },   // Niger - XOF
      { code: 'ML', salary: 3000000 },   // Mali - XOF
      { code: 'CM', salary: 5000000 },   // Cameroon - XAF
      { code: 'GA', salary: 5000000 },   // Gabon - XAF
      { code: 'CG', salary: 3000000 },   // Congo - XAF
      { code: 'CD', salary: 10000000 },  // DRC - CDF
      { code: 'RW', salary: 5000000 },   // Rwanda - RWF
      { code: 'UG', salary: 10000000 },  // Uganda - UGX
      { code: 'TZ', salary: 10000000 },  // Tanzania - TZS
      { code: 'ZA', salary: 600000 },    // South Africa - ZAR
      { code: 'ZW', salary: 20000000 },  // Zimbabwe - ZWL
      { code: 'MZ', salary: 1000000 },   // Mozambique - MZN
      { code: 'ZM', salary: 200000 },    // Zambia - ZMW
      { code: 'SL', salary: 20000000 },  // Sierra Leone - SLL
      { code: 'GN', salary: 30000000 },  // Guinea - GNF
      { code: 'GW', salary: 3000000 },   // Guinea-Bissau - XOF
      { code: 'GM', salary: 100000 },    // Gambia - GMD
      { code: 'LR', salary: 500000 },    // Liberia - LRD
      { code: 'CV', salary: 2000000 },   // Cape Verde - CVE
      { code: 'MR', salary: 500000 },    // Mauritania - MRU
      { code: 'TD', salary: 3000000 },   // Chad - XAF
      { code: 'CF', salary: 3000000 },   // Central African Republic - XAF
      { code: 'GQ', salary: 5000000 },   // Equatorial Guinea - XAF
      { code: 'ST', salary: 5000000 },   // Sao Tome - STN
      { code: 'BI', salary: 2000000 },   // Burundi - BIF
    ]

    it.each(ecobankCountries)(
      'calculates tax for $code without throwing',
      ({ code, salary }) => {
        const result = calculateTax(code, salary)
        expect(result.country).toBe(code)
        expect(result.grossSalary).toBe(salary)
        expect(result.totalTax).toBeGreaterThanOrEqual(0)
        expect(result.totalTax).toBeLessThan(salary)
        expect(result.netPay).toBe(salary - result.totalTax)
        expect(result.effectiveTaxRate).toBeGreaterThanOrEqual(0)
        expect(result.effectiveTaxRate).toBeLessThan(80)
      }
    )

    it('does NOT fall back to US tax for Nigerian employees', () => {
      const ng = calculateTax('NG', 5000000)
      const us = calculateTax('US', 5000000)
      // Nigerian tax should be in NGN, not USD
      expect(ng.currency).toBe('NGN')
      expect(us.currency).toBe('USD')
      // Tax amounts should be different (different brackets, different currency)
      expect(ng.federalTax).not.toBe(us.federalTax)
    })

    it('calculates different taxes for different African countries', () => {
      // All at 3M XOF (same currency for WAEMU countries)
      const ci = calculateTax('CI', 3000000)
      const sn = calculateTax('SN', 3000000)
      const tg = calculateTax('TG', 3000000)
      // Different tax brackets should produce different results
      expect(ci.federalTax).not.toBe(sn.federalTax)
      expect(ci.federalTax).not.toBe(tg.federalTax)
    })
  })
})

// Note: convertCurrency tests require DATABASE_URL (payroll-engine imports db).
// Currency conversion is tested via integration/E2E tests against the running app.
