/**
 * Tax Configuration Cache
 *
 * In-memory cache with 1-hour TTL for DB-backed tax configurations.
 * Falls back to hardcoded STATUTORY_REGISTRY when no DB configs exist.
 */

import { db, schema } from '@/lib/db'
import { eq, and } from 'drizzle-orm'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TaxConfigEntry {
  id: string
  country: string
  taxType: string
  rate: number
  description: string | null
  employerContribution: number
  employeeContribution: number
  effectiveDate: string | null
  status: string
}

// ---------------------------------------------------------------------------
// In-memory cache
// ---------------------------------------------------------------------------

const cache = new Map<string, { data: TaxConfigEntry[]; timestamp: number }>()
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

function getCacheKey(orgId: string): string {
  return `tax-configs:${orgId}`
}

/**
 * Get tax configs from DB, grouped by country.
 * Falls back to empty array if no configs exist (caller should use hardcoded fallback).
 */
export async function getTaxConfigsFromDB(
  orgId: string,
): Promise<TaxConfigEntry[]> {
  const key = getCacheKey(orgId)
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }

  const rows = await db.select().from(schema.taxConfigs)
    .where(and(
      eq(schema.taxConfigs.orgId, orgId),
      eq(schema.taxConfigs.status, 'active'),
    ))

  const entries: TaxConfigEntry[] = rows.map(r => ({
    id: r.id,
    country: r.country,
    taxType: r.taxType,
    rate: r.rate,
    description: r.description,
    employerContribution: r.employerContribution || 0,
    employeeContribution: r.employeeContribution || 0,
    effectiveDate: r.effectiveDate,
    status: r.status,
  }))

  cache.set(key, { data: entries, timestamp: Date.now() })
  return entries
}

/**
 * Get tax configs grouped by country.
 */
export async function getTaxConfigsByCountry(
  orgId: string,
): Promise<Record<string, TaxConfigEntry[]>> {
  const entries = await getTaxConfigsFromDB(orgId)
  const grouped: Record<string, TaxConfigEntry[]> = {}
  for (const entry of entries) {
    const c = entry.country.toUpperCase()
    if (!grouped[c]) grouped[c] = []
    grouped[c].push(entry)
  }
  return grouped
}

/**
 * Clear cache for an org (call after updating tax configs).
 */
export function invalidateTaxConfigCache(orgId?: string): void {
  if (orgId) {
    cache.delete(getCacheKey(orgId))
  } else {
    cache.clear()
  }
}

// ---------------------------------------------------------------------------
// Rate override helpers (bridge between DB configs and calculation engines)
// ---------------------------------------------------------------------------

/**
 * Get rate overrides for the generic tax calculator (calculateGenericTax).
 *
 * Maps DB tax config entries to the socialSecurityRate / pensionRate / medicareRate
 * fields used by COUNTRY_TAX_REGISTRY in tax-calculator.ts.
 *
 * Matching rules:
 * - socialSecurityRate → first 'pension' or 'social_insurance' entry with employee contribution > 0
 *   (sorted alphabetically by description to ensure consistent ordering after supersede ops)
 * - medicareRate → first 'health' entry with employee contribution > 0
 * - pensionRate → (not overridden; kept hardcoded to avoid double-counting)
 *
 * Returns null if no active DB configs exist for this country (caller should use hardcoded).
 */
export async function getTaxCalculatorOverrides(
  orgId: string,
  country: string,
): Promise<{
  socialSecurityRateOverride?: number
  medicareRateOverride?: number
} | null> {
  const allConfigs = await getTaxConfigsFromDB(orgId)
  const countryConfigs = allConfigs
    .filter(c => c.country.toUpperCase() === country.toUpperCase())
    .sort((a, b) => (a.description || '').localeCompare(b.description || ''))

  if (countryConfigs.length === 0) return null

  const result: {
    socialSecurityRateOverride?: number
    medicareRateOverride?: number
  } = {}

  // Primary social security: first pension or social_insurance entry with employee contribution
  // Sorting ensures SSNIT (Tier 1) comes before SSNIT (Tier 2) alphabetically
  const primarySS = countryConfigs.find(
    c => (c.taxType === 'pension' || c.taxType === 'social_insurance') && c.employeeContribution > 0
  )
  if (primarySS) {
    result.socialSecurityRateOverride = primarySS.employeeContribution
  }

  // Health/Medicare: first health entry with employee contribution
  const healthEntry = countryConfigs.find(
    c => c.taxType === 'health' && c.employeeContribution > 0
  )
  if (healthEntry) {
    result.medicareRateOverride = healthEntry.employeeContribution
  }

  return result
}

/**
 * Get deduction-level overrides for calculateStatutoryDeductions().
 *
 * Returns a map of deduction overrides keyed by (taxType, position within type).
 * This matches DB entries to STATUTORY_REGISTRY entries by their type and order.
 * DB entries are sorted alphabetically by description within each type group
 * to ensure consistent positional matching regardless of DB insertion order.
 *
 * For example, for Ghana:
 *   STATUTORY_REGISTRY has: pension #0 (SSNIT), health #0 (NHIS), pension #1 (Tier 2)
 *   DB sorted by desc:     pension #0 (SSNIT Tier 1), pension #1 (SSNIT Tier 2), health #0 (NHIL)
 *   Matching: pension#0→pension#0, pension#1→pension#1, health#0→health#0
 */
export async function getStatutoryDeductionOverrides(
  orgId: string,
  country: string,
): Promise<Map<string, { employeeRate: number; employerRate: number }> | null> {
  const allConfigs = await getTaxConfigsFromDB(orgId)
  const countryConfigs = allConfigs
    .filter(c => c.country.toUpperCase() === country.toUpperCase())
    .sort((a, b) => (a.description || '').localeCompare(b.description || ''))

  if (countryConfigs.length === 0) return null

  // Group DB entries by taxType (already sorted alphabetically by description)
  const dbByType = new Map<string, TaxConfigEntry[]>()
  for (const cfg of countryConfigs) {
    const arr = dbByType.get(cfg.taxType) || []
    arr.push(cfg)
    dbByType.set(cfg.taxType, arr)
  }

  // Build override map keyed by "{type}:{index}" for positional matching
  const overrides = new Map<string, { employeeRate: number; employerRate: number }>()
  for (const [type, entries] of dbByType) {
    entries.forEach((entry, idx) => {
      overrides.set(`${type}:${idx}`, {
        employeeRate: entry.employeeContribution,
        employerRate: entry.employerContribution,
      })
    })
  }

  return overrides
}
