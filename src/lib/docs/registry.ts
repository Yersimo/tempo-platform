// ─── Documentation Registry ────────────────────────────────────────────────
// Central registry mapping module slugs to their lazy-loadable documentation.
// All 43 modules now have authored content with lazy-loaded imports.

import type { ModuleDoc, DocGroup } from './types'

// ─── Registry entry shape ──────────────────────────────────────────────────
export interface DocRegistryEntry {
  slug: string
  title: string
  icon: string
  group: DocGroup
  load: () => Promise<{ default: ModuleDoc }>
}

export interface DocPlaceholderEntry {
  slug: string
  title: string
  icon: string
  group: DocGroup
}

// ─── All module documentation (fully authored) ─────────────────────────────
const ACTIVE_DOCS: DocRegistryEntry[] = [
  // ── Core ──────────────────────────────────────────────────────────────
  { slug: 'dashboard', title: 'Dashboard', icon: 'LayoutDashboard', group: 'core', load: () => import('./content/core/dashboard') },
  { slug: 'people', title: 'People', icon: 'Users', group: 'core', load: () => import('./content/core/people') },
  { slug: 'recruiting', title: 'Recruiting', icon: 'Briefcase', group: 'core', load: () => import('./content/core/recruiting') },
  { slug: 'chat', title: 'Chat', icon: 'MessageSquare', group: 'core', load: () => import('./content/core/chat') },

  // ── People ────────────────────────────────────────────────────────────
  { slug: 'performance', title: 'Performance', icon: 'TrendingUp', group: 'people', load: () => import('./content/people/performance') },
  { slug: 'compensation', title: 'Compensation', icon: 'Banknote', group: 'people', load: () => import('./content/people/compensation') },
  { slug: 'learning', title: 'Learning', icon: 'GraduationCap', group: 'people', load: () => import('./content/people/learning') },
  { slug: 'engagement', title: 'Engagement', icon: 'HeartPulse', group: 'people', load: () => import('./content/people/engagement') },
  { slug: 'mentoring', title: 'Mentoring', icon: 'UserCheck', group: 'people', load: () => import('./content/people/mentoring') },
  { slug: 'offboarding', title: 'Offboarding', icon: 'UserMinus', group: 'people', load: () => import('./content/people/offboarding') },

  // ── Operations ────────────────────────────────────────────────────────
  { slug: 'payroll', title: 'Payroll', icon: 'Wallet', group: 'operations', load: () => import('./content/operations/payroll') },
  { slug: 'benefits', title: 'Benefits', icon: 'Shield', group: 'operations', load: () => import('./content/operations/benefits') },
  { slug: 'payslips', title: 'My Payslips', icon: 'FileText', group: 'operations', load: () => import('./content/operations/payslips') },
  { slug: 'time-attendance', title: 'Time & Attendance', icon: 'Clock', group: 'operations', load: () => import('./content/operations/time-attendance') },
  { slug: 'expense', title: 'Expense', icon: 'Receipt', group: 'operations', load: () => import('./content/operations/expense') },
  { slug: 'travel', title: 'Travel', icon: 'Plane', group: 'operations', load: () => import('./content/operations/travel') },
  { slug: 'global-workforce', title: 'Global Workforce', icon: 'Globe', group: 'operations', load: () => import('./content/operations/global-workforce') },
  { slug: 'workers-comp', title: "Workers' Comp", icon: 'ShieldCheck', group: 'operations', load: () => import('./content/operations/workers-comp') },

  // ── IT & Finance ──────────────────────────────────────────────────────
  { slug: 'it-cloud', title: 'IT Cloud', icon: 'Cloud', group: 'it-finance', load: () => import('./content/it-finance/it-cloud') },
  { slug: 'it/devices', title: 'Devices', icon: 'Laptop', group: 'it-finance', load: () => import('./content/it-finance/it-devices') },
  { slug: 'it/apps', title: 'Apps', icon: 'AppWindow', group: 'it-finance', load: () => import('./content/it-finance/it-apps') },
  { slug: 'identity', title: 'Identity', icon: 'KeyRound', group: 'it-finance', load: () => import('./content/it-finance/identity') },
  { slug: 'password-manager', title: 'Passwords', icon: 'Lock', group: 'it-finance', load: () => import('./content/it-finance/password-manager') },
  { slug: 'marketplace', title: 'Marketplace', icon: 'Store', group: 'it-finance', load: () => import('./content/it-finance/marketplace') },
  { slug: 'finance/invoices', title: 'Invoices', icon: 'FileText', group: 'it-finance', load: () => import('./content/it-finance/invoices') },
  { slug: 'finance/budgets', title: 'Budgets', icon: 'PieChart', group: 'it-finance', load: () => import('./content/it-finance/budgets') },
  { slug: 'finance/cards', title: 'Corporate Cards', icon: 'CreditCard', group: 'it-finance', load: () => import('./content/it-finance/corporate-cards') },
  { slug: 'finance/bill-pay', title: 'Bill Pay', icon: 'CircleDollarSign', group: 'it-finance', load: () => import('./content/it-finance/bill-pay') },
  { slug: 'finance/global-spend', title: 'Global Spend', icon: 'Globe', group: 'it-finance', load: () => import('./content/it-finance/global-spend') },

  // ── Strategic ─────────────────────────────────────────────────────────
  { slug: 'projects', title: 'Projects', icon: 'FolderKanban', group: 'strategic', load: () => import('./content/strategic/projects') },
  { slug: 'strategy', title: 'Strategy', icon: 'Compass', group: 'strategic', load: () => import('./content/strategic/strategy') },
  { slug: 'headcount', title: 'Headcount', icon: 'UserPlus', group: 'strategic', load: () => import('./content/strategic/headcount') },
  { slug: 'compliance', title: 'Compliance', icon: 'ShieldCheck', group: 'strategic', load: () => import('./content/strategic/compliance') },
  { slug: 'workflows', title: 'Automation', icon: 'Zap', group: 'strategic', load: () => import('./content/strategic/automation') },
  { slug: 'workflow-studio', title: 'Workflow Studio', icon: 'Zap', group: 'strategic', load: () => import('./content/strategic/workflow-studio') },
  { slug: 'analytics', title: 'Analytics', icon: 'BarChart3', group: 'strategic', load: () => import('./content/strategic/analytics') },
  { slug: 'documents', title: 'Documents', icon: 'FileSignature', group: 'strategic', load: () => import('./content/strategic/documents') },
  { slug: 'app-studio', title: 'App Studio', icon: 'Blocks', group: 'strategic', load: () => import('./content/strategic/app-studio') },
  { slug: 'sandbox', title: 'Sandbox', icon: 'FlaskConical', group: 'strategic', load: () => import('./content/strategic/sandbox') },
  { slug: 'groups', title: 'Groups', icon: 'Network', group: 'strategic', load: () => import('./content/strategic/groups') },
  { slug: 'developer', title: 'Developer', icon: 'Code', group: 'strategic', load: () => import('./content/strategic/developer') },

  // ── Additional ────────────────────────────────────────────────────────
  { slug: 'onboarding', title: 'Onboarding', icon: 'UserPlus', group: 'additional', load: () => import('./content/additional/onboarding') },
  { slug: 'settings', title: 'Settings', icon: 'Settings', group: 'additional', load: () => import('./content/additional/settings') },
]

// ─── Registry API ──────────────────────────────────────────────────────────

/** All modules that have authored documentation content */
export const docRegistry: DocRegistryEntry[] = ACTIVE_DOCS

/** All module stubs (for browse grid — includes slug, title, icon, group) */
export const allModuleSlugs: DocPlaceholderEntry[] = ACTIVE_DOCS.map(
  ({ slug, title, icon, group }) => ({ slug, title, icon, group })
)

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

/** Get all module entries grouped by DocGroup. */
export function getModulesByGroup(): Record<string, DocPlaceholderEntry[]> {
  const grouped: Record<string, DocPlaceholderEntry[]> = {}
  for (const entry of allModuleSlugs) {
    if (!grouped[entry.group]) grouped[entry.group] = []
    grouped[entry.group].push(entry)
  }
  return grouped
}
