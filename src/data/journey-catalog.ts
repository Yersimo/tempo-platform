/**
 * Tempo User Journey Catalog — v2
 *
 * 299 journeys imported from the canonical catalog spreadsheet, with
 * tier classification applied. This is the source of truth for the
 * /eval test harness.
 *
 * To regenerate: re-run the python extractor against the source xlsx.
 * Schema is stable; tier classification heuristic lives in the generator.
 */

import catalogJson from './journey-catalog.json'

export type Tier = 'T1' | 'T2' | 'T3' | 'T4'
export type ModuleState = 'shipped' | 'partial' | 'missing'
export type Difficulty = 'Routine' | 'Complex' | 'Crisis' | 'Edge' | 'Sensitive' | ''

export interface Journey {
  id: string
  persona: string
  sub: string
  cat: string
  diff: Difficulty
  wow: number
  trigger: string
  friction: string
  flow: string
  systems: string
  ai: string
  tier: Tier
  tierReason: string
}

export interface CatalogMeta {
  version: string
  totalJourneys: number
  tierDistribution: Record<string, number>
  generatedAt: string
}

export interface JourneyCatalog {
  meta: CatalogMeta
  modules: Record<string, ModuleState>
  journeys: Journey[]
}

export const journeyCatalog = catalogJson as unknown as JourneyCatalog

// ─── The 4-check verification rubric ────────────────────────────────
export const RUBRIC_CHECKS = [
  {
    id: 'context_retention',
    label: 'Context Retention',
    question: 'Did the platform demand an input the database already owns?',
    failIf: 'Agent asks for Employee ID, Cost Centre, Supervisor name, country, role, or any other data already known.',
    why: 'Tempo IS the integration point. Re-asking proves it isn\'t.',
  },
  {
    id: 'screen_exit',
    label: 'Screen Exit',
    question: 'Did the user have to leave the originating screen to complete a dependent task?',
    failIf: "Agent says 'now open Workday', 'file a ServiceNow ticket', 'check your email', 'visit the benefits portal'.",
    why: 'One-screen completion is a design move. Hand-offs are friction by another name.',
  },
  {
    id: 'approval_gate',
    label: 'Approval Gate Discipline',
    question: 'Did the system wait for human approval on a minor, policy-compliant task instead of executing by exception?',
    failIf: 'Agent routes a request that is clearly within policy to a manager for unnecessary approval.',
    why: 'Bias to action: approve by exception, not by default.',
  },
  {
    id: 'closed_loop',
    label: 'Closed Loop Status',
    question: 'Did the agent end the flow with a clear status map: what just happened, what\'s next, when?',
    failIf: 'Agent leaves the user without confirmation, ETA, owner, or next step.',
    why: 'Users should never have to ask "did it work?"',
  },
] as const

export type RubricCheckId = (typeof RUBRIC_CHECKS)[number]['id']

export interface RubricResult {
  [check: string]: 'pass' | 'fail' | 'na' | 'unscored'
}

export type Verdict = 'pass' | 'partial' | 'fail' | 'unscored'

/** Score a rubric result: 0 fails = pass, 1 = partial, 2+ = fail. */
export function scoreRubric(r: RubricResult): Verdict {
  const failed = Object.values(r).filter((v) => v === 'fail').length
  const scored = Object.values(r).filter((v) => v !== 'unscored').length
  if (scored === 0) return 'unscored'
  if (failed === 0) return 'pass'
  if (failed === 1) return 'partial'
  return 'fail'
}

// ─── Catalog helpers ────────────────────────────────────────────────

export function getJourney(id: string): Journey | undefined {
  return journeyCatalog.journeys.find((j) => j.id === id)
}

export function filterJourneys(filters: {
  persona?: string
  difficulty?: Difficulty
  tier?: Tier
  minWow?: number
  category?: string
  search?: string
}): Journey[] {
  return journeyCatalog.journeys.filter((j) => {
    if (filters.persona && j.persona !== filters.persona) return false
    if (filters.difficulty && j.diff !== filters.difficulty) return false
    if (filters.tier && j.tier !== filters.tier) return false
    if (filters.minWow && j.wow < filters.minWow) return false
    if (filters.category && j.cat !== filters.category) return false
    if (filters.search) {
      const q = filters.search.toLowerCase()
      const hay = [j.id, j.persona, j.sub, j.cat, j.trigger, j.flow]
        .join(' ')
        .toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
}

export function getPersonas(): string[] {
  const set = new Set(journeyCatalog.journeys.map((j) => j.persona))
  return Array.from(set).sort()
}

export function getCategories(): string[] {
  const set = new Set(journeyCatalog.journeys.map((j) => j.cat))
  return Array.from(set).filter(Boolean).sort()
}
