// ─── Documentation Registry ────────────────────────────────────────────────
// Central registry mapping module slugs to their lazy-loadable documentation.
// Only modules with authored content have active imports. The remaining entries
// are commented out and will be enabled as their content files are created.

import type { ModuleDoc, DocGroup } from './types'

// ─── Registry entry shape ──────────────────────────────────────────────────
export interface DocRegistryEntry {
  slug: string
  title: string
  icon: string
  group: DocGroup
  load: () => Promise<{ default: ModuleDoc }>
}

// ─── Active module documentation (authored content) ────────────────────────
const ACTIVE_DOCS: DocRegistryEntry[] = [
  // Core
  {
    slug: 'dashboard',
    title: 'Dashboard',
    icon: 'LayoutDashboard',
    group: 'core',
    load: () => import('./content/core/dashboard'),
  },
  {
    slug: 'people',
    title: 'People',
    icon: 'Users',
    group: 'core',
    load: () => import('./content/core/people'),
  },

  // Operations
  {
    slug: 'payroll',
    title: 'Payroll',
    icon: 'Wallet',
    group: 'operations',
    load: () => import('./content/operations/payroll'),
  },
  {
    slug: 'benefits',
    title: 'Benefits',
    icon: 'Shield',
    group: 'operations',
    load: () => import('./content/operations/benefits'),
  },
]

// ─── Placeholder entries for modules without authored content yet ──────────
// These entries define the slug, title, icon, and group for every module in
// the platform. They do not have a `load` function because their content
// files have not been created yet. Enable each one by adding a `load` prop
// pointing to the corresponding content file.

export interface DocPlaceholderEntry {
  slug: string
  title: string
  icon: string
  group: DocGroup
}

const PLACEHOLDER_DOCS: DocPlaceholderEntry[] = [
  // Core (remaining)
  { slug: 'recruiting', title: 'Recruiting', icon: 'Briefcase', group: 'core' },
  { slug: 'chat', title: 'Chat', icon: 'MessageSquare', group: 'core' },

  // People
  { slug: 'performance', title: 'Performance', icon: 'TrendingUp', group: 'people' },
  { slug: 'compensation', title: 'Compensation', icon: 'Banknote', group: 'people' },
  { slug: 'learning', title: 'Learning', icon: 'GraduationCap', group: 'people' },
  { slug: 'engagement', title: 'Engagement', icon: 'HeartPulse', group: 'people' },
  { slug: 'mentoring', title: 'Mentoring', icon: 'UserCheck', group: 'people' },
  { slug: 'offboarding', title: 'Offboarding', icon: 'UserMinus', group: 'people' },

  // Operations (remaining)
  { slug: 'payslips', title: 'My Payslips', icon: 'FileText', group: 'operations' },
  { slug: 'time-attendance', title: 'Time & Attendance', icon: 'Clock', group: 'operations' },
  { slug: 'expense', title: 'Expense', icon: 'Receipt', group: 'operations' },
  { slug: 'travel', title: 'Travel', icon: 'Plane', group: 'operations' },
  { slug: 'global-workforce', title: 'Global Workforce', icon: 'Globe', group: 'operations' },
  { slug: 'workers-comp', title: "Workers' Comp", icon: 'ShieldCheck', group: 'operations' },

  // IT & Finance
  { slug: 'it-cloud', title: 'IT Cloud', icon: 'Cloud', group: 'it-finance' },
  { slug: 'it/devices', title: 'Devices', icon: 'Laptop', group: 'it-finance' },
  { slug: 'it/apps', title: 'Apps', icon: 'AppWindow', group: 'it-finance' },
  { slug: 'identity', title: 'Identity', icon: 'KeyRound', group: 'it-finance' },
  { slug: 'password-manager', title: 'Passwords', icon: 'Lock', group: 'it-finance' },
  { slug: 'marketplace', title: 'Marketplace', icon: 'Store', group: 'it-finance' },
  { slug: 'finance/invoices', title: 'Invoices', icon: 'FileText', group: 'it-finance' },
  { slug: 'finance/budgets', title: 'Budgets', icon: 'PieChart', group: 'it-finance' },
  { slug: 'finance/cards', title: 'Corporate Cards', icon: 'CreditCard', group: 'it-finance' },
  { slug: 'finance/bill-pay', title: 'Bill Pay', icon: 'CircleDollarSign', group: 'it-finance' },
  { slug: 'finance/global-spend', title: 'Global Spend', icon: 'Globe', group: 'it-finance' },

  // Strategic
  { slug: 'projects', title: 'Projects', icon: 'FolderKanban', group: 'strategic' },
  { slug: 'strategy', title: 'Strategy', icon: 'Compass', group: 'strategic' },
  { slug: 'headcount', title: 'Headcount', icon: 'UserPlus', group: 'strategic' },
  { slug: 'compliance', title: 'Compliance', icon: 'ShieldCheck', group: 'strategic' },
  { slug: 'workflows', title: 'Automation', icon: 'Zap', group: 'strategic' },
  { slug: 'workflow-studio', title: 'Workflow Studio', icon: 'Zap', group: 'strategic' },
  { slug: 'analytics', title: 'Analytics', icon: 'BarChart3', group: 'strategic' },
  { slug: 'documents', title: 'Documents', icon: 'FileSignature', group: 'strategic' },
  { slug: 'app-studio', title: 'App Studio', icon: 'Blocks', group: 'strategic' },
  { slug: 'sandbox', title: 'Sandbox', icon: 'FlaskConical', group: 'strategic' },
  { slug: 'groups', title: 'Groups', icon: 'Network', group: 'strategic' },
  { slug: 'developer', title: 'Developer', icon: 'Code', group: 'strategic' },

  // Additional (Settings and other top-level modules)
  { slug: 'settings', title: 'Settings', icon: 'Settings', group: 'additional' },
]

// ─── Registry API ──────────────────────────────────────────────────────────

/** All modules that have authored documentation content */
export const docRegistry: DocRegistryEntry[] = ACTIVE_DOCS

/** All module stubs including those without content yet */
export const allModuleSlugs: DocPlaceholderEntry[] = [
  ...ACTIVE_DOCS.map(({ slug, title, icon, group }) => ({ slug, title, icon, group })),
  ...PLACEHOLDER_DOCS,
]

/** Lookup a doc entry by slug. Returns undefined if the module has no authored content. */
export function getDocEntry(slug: string): DocRegistryEntry | undefined {
  return ACTIVE_DOCS.find((entry) => entry.slug === slug)
}

/** Load a module's documentation by slug. Returns null if not found. */
export async function loadDoc(slug: string): Promise<ModuleDoc | null> {
  const entry = getDocEntry(slug)
  if (!entry) return null
  const mod = await entry.load()
  return mod.default
}

/** Load all authored documentation modules. */
export async function loadAllDocs(): Promise<ModuleDoc[]> {
  const results = await Promise.all(
    ACTIVE_DOCS.map(async (entry) => {
      const mod = await entry.load()
      return mod.default
    })
  )
  return results
}

/** Check whether a module slug has authored documentation. */
export function hasDoc(slug: string): boolean {
  return ACTIVE_DOCS.some((entry) => entry.slug === slug)
}

/** Get all slugs that have authored documentation. */
export function getDocSlugs(): string[] {
  return ACTIVE_DOCS.map((entry) => entry.slug)
}

/** Get all module entries (active + placeholder) grouped by DocGroup. */
export function getModulesByGroup(): Record<string, DocPlaceholderEntry[]> {
  const grouped: Record<string, DocPlaceholderEntry[]> = {}
  for (const entry of allModuleSlugs) {
    if (!grouped[entry.group]) grouped[entry.group] = []
    grouped[entry.group].push(entry)
  }
  return grouped
}
