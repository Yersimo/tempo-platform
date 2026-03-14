import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// --------------------------------------------------------------------------
// Mock next/navigation
// --------------------------------------------------------------------------
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  redirect: vi.fn(),
  notFound: vi.fn(),
}))

// --------------------------------------------------------------------------
// Mock next-intl
// --------------------------------------------------------------------------
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
  useNow: () => new Date(),
  useTimeZone: () => 'UTC',
}))

// --------------------------------------------------------------------------
// Mock @/lib/db (database layer — not available in tests)
// --------------------------------------------------------------------------
vi.mock('@/lib/db', () => ({
  db: {},
  schema: {},
}))

// --------------------------------------------------------------------------
// Mock payroll tax-config-cache (DB-dependent)
// --------------------------------------------------------------------------
vi.mock('@/lib/payroll/tax-config-cache', () => ({
  getStatutoryDeductionOverrides: vi.fn().mockResolvedValue(null),
  getTaxConfigsForCountry: vi.fn().mockResolvedValue([]),
}))
