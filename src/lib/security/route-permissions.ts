/**
 * Route → Permission mapping for middleware authorization.
 *
 * Routes with an empty array are accessible to all authenticated users.
 * Routes not listed here default to open (all authenticated users).
 */

import type { Permission } from './permissions'

// ── Route permission map ───────────────────────────────────────────────────

const ROUTE_PERMISSIONS: Record<string, Permission[]> = {
  // ── Operations ──
  '/payroll':             ['payroll:read'],
  '/compensation':        ['compensation:read'],
  '/onboarding':          ['onboarding:read'],
  '/offboarding':         ['offboarding:read'],
  '/global-workforce':    ['people:read'],
  '/workers-comp':        ['compliance:read'],

  // ── Finance ──
  '/finance/budgets':     ['budgets:read'],
  '/finance/invoices':    ['invoices:read'],
  '/finance/cards':       ['finance:read'],
  '/finance/bill-pay':    ['finance:read'],
  '/finance/global-spend':['finance:read'],
  '/finance/vendors':     ['finance:read'],

  // ── IT ──
  '/it/devices':          ['it:read'],
  '/it/apps':             ['it:read'],
  '/devices':             ['it:read'],
  '/apps':                ['it:read'],
  '/it-cloud':            ['it:read'],
  '/identity':            ['identity:read'],
  '/password-manager':    ['it:read'],

  // ── Recruiting ──
  '/recruiting':          ['recruiting:read'],
  '/headcount':           ['headcount:read'],

  // ── Compliance ──
  '/compliance':          ['compliance:read'],

  // ── Settings & Admin ──
  '/settings':            ['settings:read'],
  '/settings/security':   ['settings:manage'],
  '/workflows':           ['workflows:read'],
  '/workflow-studio':     ['workflows:manage'],
  '/app-studio':          ['admin:full'],
  '/sandbox':             ['admin:full'],
  '/developer':           ['admin:full'],
  '/marketplace':         ['settings:read'],

  // ── Analytics ──
  '/analytics':           ['analytics:read'],

  // ── Open to all authenticated users ──
  '/dashboard':           [],
  '/people':              [],
  '/performance':         [],
  '/learning':            [],
  '/engagement':          [],
  '/mentoring':           [],
  '/benefits':            [],
  '/expense':             [],
  '/expenses':            [],
  '/time-attendance':     [],
  '/time':                [],
  '/payslips':            [],
  '/chat':                [],
  '/projects':            [],
  '/strategy':            [],
  '/travel':              [],
  '/documents':           [],
  '/groups':              [],
  '/help':                [],
  '/access-denied':       [],
}

// ── Lookup ─────────────────────────────────────────────────────────────────

/**
 * Given a pathname, return the permissions required to access it.
 *
 * Tries longest-prefix match first so `/finance/budgets` matches before
 * `/finance`. If no entry is found, returns `null` (route is unguarded /
 * open to all authenticated users).
 */
export function getRequiredPermissions(pathname: string): Permission[] | null {
  // Exact match first
  if (pathname in ROUTE_PERMISSIONS) {
    return ROUTE_PERMISSIONS[pathname]
  }

  // Try progressively shorter prefixes (e.g. /finance/budgets/123 → /finance/budgets)
  const segments = pathname.split('/')
  while (segments.length > 1) {
    segments.pop()
    const prefix = segments.join('/')
    if (prefix in ROUTE_PERMISSIONS) {
      return ROUTE_PERMISSIONS[prefix]
    }
  }

  // Route not mapped — default to open
  return null
}

export { ROUTE_PERMISSIONS }
