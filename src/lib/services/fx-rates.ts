/**
 * Live Exchange Rate Service with 24-Hour Caching
 *
 * Fetches rates from ExchangeRate-API (free tier) with in-memory caching.
 * Falls back to hardcoded approximate rates when the API is unavailable.
 */

// ============================================================
// TYPES
// ============================================================

export interface FXRateResult {
  from: string
  to: string
  rate: number
  timestamp: number // when the rate was fetched
  source: 'live' | 'cached' | 'fallback'
}

interface RateCache {
  rates: Record<string, number>
  fetchedAt: number
}

// ============================================================
// CONSTANTS
// ============================================================

const API_URL = 'https://open.er-api.com/v6/latest/USD'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

/**
 * Hardcoded fallback rates relative to USD (approximate mid-market rates).
 * Sourced from the payroll engine. Used when the live API is unreachable.
 */
const FALLBACK_RATES: Record<string, number> = {
  // Base
  USD: 1.0,

  // Major currencies
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.36,
  AUD: 1.53,
  JPY: 149.50,
  INR: 83.12,
  BRL: 4.97,
  CHF: 0.88,
  NZD: 1.65,

  // African currencies
  NGN: 1550.0,    // Nigerian Naira
  GHS: 15.50,     // Ghanaian Cedi
  KES: 153.0,     // Kenyan Shilling
  ZAR: 18.50,     // South African Rand
  XOF: 605.0,     // CFA Franc BCEAO (Senegal, CI, Benin, Togo, Mali, BF, Niger, Guinea-Bissau)
  XAF: 605.0,     // CFA Franc BEAC (Cameroon, Gabon, Congo, Chad, CAR, Equatorial Guinea)
  TZS: 2650.0,    // Tanzanian Shilling
  UGX: 3780.0,    // Ugandan Shilling
  RWF: 1350.0,    // Rwandan Franc
  ETB: 57.0,      // Ethiopian Birr
  CDF: 2750.0,    // Congolese Franc (DRC)
  ZMW: 27.0,      // Zambian Kwacha
  ZWL: 14000.0,   // Zimbabwean Dollar
  MZN: 63.50,     // Mozambican Metical
  BWP: 13.50,     // Botswana Pula
  MUR: 45.50,     // Mauritian Rupee
  NAD: 18.50,     // Namibian Dollar
  AOA: 835.0,     // Angolan Kwanza
  MWK: 1720.0,    // Malawian Kwacha
  MGA: 4550.0,    // Malagasy Ariary
  SZL: 18.50,     // Eswatini Lilangeni
  LSL: 18.50,     // Lesotho Loti
  SCR: 14.50,     // Seychellois Rupee
  CVE: 101.0,     // Cape Verdean Escudo
  STN: 22.50,     // Sao Tome and Principe Dobra
  KMF: 452.0,     // Comorian Franc
  GMD: 70.0,      // Gambian Dalasi
  GNF: 8600.0,    // Guinean Franc
  BIF: 2860.0,    // Burundian Franc
  SLL: 22800.0,   // Sierra Leonean Leone
  LRD: 192.0,     // Liberian Dollar
  MRU: 39.50,     // Mauritanian Ouguiya
  EGP: 50.50,     // Egyptian Pound
  MAD: 10.0,      // Moroccan Dirham
  TND: 3.12,      // Tunisian Dinar
  DZD: 134.0,     // Algerian Dinar
  SOS: 571.0,     // Somali Shilling
  SSP: 1350.0,    // South Sudanese Pound
  SDG: 601.0,     // Sudanese Pound
  LYD: 4.85,      // Libyan Dinar
  ERN: 15.0,      // Eritrean Nakfa
  DJF: 177.7,     // Djiboutian Franc

  // Other common currencies
  CNY: 7.24,      // Chinese Yuan
  HKD: 7.82,      // Hong Kong Dollar
  SGD: 1.34,      // Singapore Dollar
  KRW: 1320.0,    // South Korean Won
  MXN: 17.15,     // Mexican Peso
  THB: 35.50,     // Thai Baht
  IDR: 15650.0,   // Indonesian Rupiah
  PHP: 56.0,      // Philippine Peso
  MYR: 4.65,      // Malaysian Ringgit
  SEK: 10.45,     // Swedish Krona
  NOK: 10.55,     // Norwegian Krone
  DKK: 6.87,      // Danish Krone
  PLN: 4.02,      // Polish Zloty
  CZK: 22.80,     // Czech Koruna
  HUF: 355.0,     // Hungarian Forint
  ILS: 3.65,      // Israeli New Shekel
  AED: 3.67,      // UAE Dirham
  SAR: 3.75,      // Saudi Riyal
  QAR: 3.64,      // Qatari Riyal
  KWD: 0.31,      // Kuwaiti Dinar
  BHD: 0.38,      // Bahraini Dinar
  OMR: 0.38,      // Omani Rial
  TRY: 30.25,     // Turkish Lira
  ARS: 830.0,     // Argentine Peso
  CLP: 880.0,     // Chilean Peso
  COP: 3950.0,    // Colombian Peso
  PEN: 3.72,      // Peruvian Sol
}

// ============================================================
// IN-MEMORY CACHE
// ============================================================

let cache: RateCache | null = null

/**
 * Check whether the cache is still valid (populated and within TTL).
 */
function isCacheValid(): boolean {
  if (!cache) return false
  return Date.now() - cache.fetchedAt < CACHE_TTL_MS
}

// ============================================================
// INTERNAL HELPERS
// ============================================================

/**
 * Fetch fresh rates from the ExchangeRate-API and store them in the cache.
 * Returns the rates on success, or null if the request fails.
 */
async function fetchLiveRates(): Promise<Record<string, number> | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10_000) // 10s timeout

    const response = await fetch(API_URL, { signal: controller.signal })
    clearTimeout(timeoutId)

    if (!response.ok) {
      console.warn(`[fx-rates] API responded with status ${response.status}`)
      return null
    }

    const data = await response.json()

    if (data.result !== 'success' || !data.rates) {
      console.warn('[fx-rates] Unexpected API response shape', data.result)
      return null
    }

    const rates: Record<string, number> = data.rates

    // Persist to cache
    cache = {
      rates,
      fetchedAt: Date.now(),
    }

    return rates
  } catch (error) {
    console.warn('[fx-rates] Failed to fetch live rates:', (error as Error).message)
    return null
  }
}

/**
 * Resolve the current rate map, trying (in order):
 *   1. Valid in-memory cache
 *   2. Fresh fetch from the API
 *   3. Hardcoded fallback rates
 *
 * Returns a tuple of [rates, source].
 */
async function resolveRates(): Promise<[Record<string, number>, 'live' | 'cached' | 'fallback']> {
  // 1. Return cached rates if still fresh
  if (isCacheValid()) {
    return [cache!.rates, 'cached']
  }

  // 2. Attempt a live fetch
  const liveRates = await fetchLiveRates()
  if (liveRates) {
    return [liveRates, 'live']
  }

  // 3. If we have a stale cache, prefer it over hardcoded fallback
  if (cache) {
    console.warn('[fx-rates] Using stale cached rates (API unreachable)')
    return [cache.rates, 'cached']
  }

  // 4. Last resort: hardcoded fallback
  console.warn('[fx-rates] Using hardcoded fallback rates')
  return [FALLBACK_RATES, 'fallback']
}

/**
 * Look up the USD-based rate for a single currency code.
 * Throws if the currency is not found in the resolved rate map.
 */
function getRateOrThrow(rates: Record<string, number>, currency: string): number {
  const code = currency.toUpperCase()
  const rate = rates[code]
  if (rate === undefined) {
    throw new Error(`[fx-rates] Unknown currency code: ${code}`)
  }
  return rate
}

// ============================================================
// PUBLIC API
// ============================================================

/**
 * Get the exchange rate between two currencies.
 *
 * The rate is expressed as: 1 unit of `from` = `rate` units of `to`.
 *
 * @example
 *   const result = await getExchangeRate('USD', 'EUR')
 *   // result.rate ~= 0.92  (1 USD = 0.92 EUR)
 */
export async function getExchangeRate(from: string, to: string): Promise<FXRateResult> {
  const [rates, source] = await resolveRates()

  const fromRate = getRateOrThrow(rates, from)
  const toRate = getRateOrThrow(rates, to)

  // Both rates are relative to USD, so cross-rate = toRate / fromRate
  const rate = toRate / fromRate

  return {
    from: from.toUpperCase(),
    to: to.toUpperCase(),
    rate,
    timestamp: cache?.fetchedAt ?? Date.now(),
    source,
  }
}

/**
 * Get all available USD-based exchange rates.
 *
 * Each key is a currency code and each value is how many units of
 * that currency equal 1 USD.
 */
export async function getAllRates(): Promise<Record<string, number>> {
  const [rates] = await resolveRates()
  return { ...rates }
}

/**
 * Convert a monetary amount from one currency to another.
 *
 * @example
 *   const euros = await convertAmount(100, 'USD', 'EUR')
 *   // euros ~= 92.0
 */
export async function convertAmount(amount: number, from: string, to: string): Promise<number> {
  const { rate } = await getExchangeRate(from, to)
  return amount * rate
}

/**
 * Force-refresh the rate cache by fetching from the live API.
 *
 * If the API call fails, the existing cache (if any) is left intact
 * so that subsequent reads still return the best available data.
 */
export async function refreshRates(): Promise<void> {
  const liveRates = await fetchLiveRates()
  if (!liveRates) {
    console.warn('[fx-rates] refreshRates: API call failed; cache unchanged')
  }
}
