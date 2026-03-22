'use client'

import { useTempo } from '@/lib/store'
import { ScenarioSelector } from './scenario-selector'

/** Patterns in the user email that enable the demo scenario selector */
const DEMO_PATTERNS = ['demo', 'evaluator', 'ecoghana', 'test']

function isDemoEmail(email: string | undefined): boolean {
  if (!email) return false
  const lower = email.toLowerCase()
  return DEMO_PATTERNS.some(p => lower.includes(p))
}

/**
 * Gate component that only renders ScenarioSelector for demo/evaluator accounts.
 * Placed inside TempoProvider so useTempo() is available.
 */
export function DemoScenarioGate() {
  const { currentUser } = useTempo()
  if (!isDemoEmail(currentUser?.email)) return null
  return <ScenarioSelector />
}
