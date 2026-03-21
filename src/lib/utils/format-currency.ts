/**
 * Locale-aware currency formatting for Africa-first display.
 * Uses Intl.NumberFormat with proper currency symbols.
 */

const CURRENCY_SYMBOLS: Record<string, string> = {
  GHS: '₵', NGN: '₦', KES: 'KSh', ZAR: 'R', TZS: 'TSh',
  UGX: 'USh', RWF: 'RF', ETB: 'Br', EGP: 'E£', MAD: 'MAD',
  XOF: 'CFA', XAF: 'FCFA', USD: '$', EUR: '€', GBP: '£',
  MZN: 'MT', ZMW: 'ZK', BWP: 'P', MUR: '₨', NAD: 'N$',
  CDF: 'FC', AOA: 'Kz', TND: 'DT', DZD: 'DA', LYD: 'LD', ZWL: 'Z$',
}

export function formatCurrency(
  amount: number | null | undefined,
  currency: string = 'USD',
  options?: { compact?: boolean; cents?: boolean }
): string {
  if (amount == null) return '—'

  const value = options?.cents ? amount / 100 : amount

  try {
    if (options?.compact && Math.abs(value) >= 1000) {
      const formatter = new Intl.NumberFormat('en', {
        notation: 'compact',
        maximumFractionDigits: 1,
      })
      const symbol = CURRENCY_SYMBOLS[currency] || currency
      return `${symbol}${formatter.format(value)}`
    }

    const formatted = new Intl.NumberFormat('en', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value)
    // Intl may render ISO code (e.g. "GHS 0") instead of symbol — replace with our symbol map
    const sym = CURRENCY_SYMBOLS[currency]
    if (sym && formatted.startsWith(currency)) {
      return `${sym}${formatted.slice(currency.length).trimStart()}`
    }
    return formatted
  } catch {
    // Fallback for unsupported currency codes
    const symbol = CURRENCY_SYMBOLS[currency] || currency
    return `${symbol}${value.toLocaleString()}`
  }
}

export function formatAmount(
  amount: number | null | undefined,
  options?: { decimals?: number }
): string {
  if (amount == null) return '—'
  return amount.toLocaleString('en', {
    minimumFractionDigits: options?.decimals ?? 0,
    maximumFractionDigits: options?.decimals ?? 2,
  })
}
