'use client'

/**
 * /eval/reports — Tier-1 grade + Tier-2 build plan
 */

import { useState } from 'react'
import reports from '@/data/journey-reports.json'
import '../eval.css'
import './reports.css'

interface Tier1Item {
  id: string
  persona: string
  sub: string
  cat: string
  trigger: string
  wow: number
  diff: string
  reason?: string
}

interface Tier2Item {
  id: string
  persona: string
  sub: string
  cat: string
  trigger: string
  wow: number
  diff: string
  flow: string
  systems: string
  effortWeeks: number
  dependencies: string[]
  priority: number
}

interface Reports {
  tier1: {
    totalJourneys: number
    predictedPass: number
    predictedPartial: number
    predictedFail: number
    pass: Tier1Item[]
    partial: Tier1Item[]
  }
  tier2plan: { topJourneys: Tier2Item[] }
}

const REPORTS = reports as unknown as Reports

export default function ReportsPage() {
  const [view, setView] = useState<'tier1' | 'tier2'>('tier1')

  const totalT2Effort = REPORTS.tier2plan.topJourneys.reduce(
    (sum, j) => sum + j.effortWeeks,
    0,
  )

  return (
    <main className="eval">
      <header className="eval-header">
        <div>
          <p className="eval-eyebrow">Catalog Reports</p>
          <h1 className="eval-title">Tier-1 grade · Tier-2 build plan</h1>
          <p className="eval-sub">
            Generated against 299 journeys. Use these to drive roadmap.
          </p>
        </div>
        <a href="/eval" className="eval-reports-link">← Back to harness</a>
      </header>

      <nav className="reports-tabs">
        <button
          type="button"
          className={`reports-tab ${view === 'tier1' ? 'is-active' : ''}`}
          onClick={() => setView('tier1')}
        >
          Tier 1 grade — {REPORTS.tier1.totalJourneys} journeys
        </button>
        <button
          type="button"
          className={`reports-tab ${view === 'tier2' ? 'is-active' : ''}`}
          onClick={() => setView('tier2')}
        >
          Tier 2 build plan — top 20 ({totalT2Effort.toFixed(1)} eng-weeks)
        </button>
      </nav>

      {view === 'tier1' ? <Tier1Report /> : <Tier2Report />}
    </main>
  )
}

function Tier1Report() {
  return (
    <section className="reports-section">
      <div className="reports-stats">
        <div className="reports-stat reports-stat-pass">
          <strong>{REPORTS.tier1.predictedPass}</strong>
          <span>Predicted PASS</span>
        </div>
        <div className="reports-stat reports-stat-partial">
          <strong>{REPORTS.tier1.predictedPartial}</strong>
          <span>Predicted PARTIAL</span>
        </div>
        <div className="reports-stat reports-stat-fail">
          <strong>{REPORTS.tier1.predictedFail}</strong>
          <span>Predicted FAIL</span>
        </div>
        <div className="reports-stat">
          <strong>{Math.round((REPORTS.tier1.predictedPass / REPORTS.tier1.totalJourneys) * 100)}%</strong>
          <span>Pass rate</span>
        </div>
      </div>

      <article className="reports-callout">
        <h3>What this means</h3>
        <p>
          Of the 114 Tier-1 journeys, Tempo&apos;s current platform shape + Policy Engine should
          pass all of them on the 4-check rubric without additional build. These are the
          journeys safe to lead a customer demo with. They cover the daily-life Routine
          category and most of the Expenses category — the moments employees feel every day.
        </p>
        <p className="reports-callout-sub">
          Verify manually by selecting any journey in /eval and running the trigger through
          /chat or the relevant module. The harness scores it.
        </p>
      </article>

      <h3 className="reports-h3">Tier 1 · Predicted PASS ({REPORTS.tier1.pass.length})</h3>
      <table className="reports-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Persona</th>
            <th>Category</th>
            <th>Trigger</th>
            <th>Wow</th>
          </tr>
        </thead>
        <tbody>
          {REPORTS.tier1.pass.map((j) => (
            <tr key={j.id}>
              <td className="reports-id">{j.id}</td>
              <td>{j.persona} · {j.sub}</td>
              <td>{j.cat}</td>
              <td>{j.trigger}</td>
              <td className="reports-wow">{'★'.repeat(j.wow)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function Tier2Report() {
  const totalEffort = REPORTS.tier2plan.topJourneys.reduce(
    (sum, j) => sum + j.effortWeeks,
    0,
  )

  // Group by sub-system dependency
  const sequencing = sequenceByDependencies(REPORTS.tier2plan.topJourneys)

  return (
    <section className="reports-section">
      <div className="reports-stats">
        <div className="reports-stat">
          <strong>{REPORTS.tier2plan.topJourneys.length}</strong>
          <span>Journeys planned</span>
        </div>
        <div className="reports-stat">
          <strong>{totalEffort.toFixed(1)}</strong>
          <span>Total eng-weeks</span>
        </div>
        <div className="reports-stat">
          <strong>{Math.ceil(totalEffort / 4)}</strong>
          <span>Months @ 1 engineer</span>
        </div>
        <div className="reports-stat">
          <strong>{Math.ceil(totalEffort / 8)}</strong>
          <span>Months @ 2 engineers</span>
        </div>
      </div>

      <article className="reports-callout">
        <h3>Sequencing strategy</h3>
        <p>
          Journeys are grouped by shared dependencies so a single capability build unlocks
          multiple journeys. Build the dependency first, then unlock the journeys it enables.
        </p>
      </article>

      <h3 className="reports-h3">Build sequence — 4 phases</h3>
      {sequencing.map((phase) => (
        <article key={phase.name} className="reports-phase">
          <header className="reports-phase-head">
            <h4>{phase.name}</h4>
            <span className="reports-phase-effort">
              {phase.totalWeeks.toFixed(1)} eng-weeks · {phase.journeys.length} journeys
            </span>
          </header>
          <p className="reports-phase-desc">{phase.description}</p>
          <table className="reports-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Trigger</th>
                <th>Persona</th>
                <th>Diff</th>
                <th>Wow</th>
                <th>Effort</th>
                <th>Dependencies</th>
              </tr>
            </thead>
            <tbody>
              {phase.journeys.map((j) => (
                <tr key={j.id}>
                  <td className="reports-id">{j.id}</td>
                  <td>{j.trigger}</td>
                  <td>{j.persona}/{j.sub}</td>
                  <td>{j.diff}</td>
                  <td className="reports-wow">{'★'.repeat(j.wow)}</td>
                  <td>{j.effortWeeks}w</td>
                  <td>{j.dependencies.join(' · ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      ))}
    </section>
  )
}

function sequenceByDependencies(journeys: Tier2Item[]) {
  // Phase 1: routine Tier 2 (no special deps) — quickest unlocks
  const phase1 = journeys.filter((j) =>
    j.dependencies.includes('Base Tempo modules') ||
    j.dependencies.length === 1,
  )
  // Phase 2: Identity/Provisioning orchestrator unlocks (IT-heavy)
  const phase2 = journeys.filter((j) =>
    j.dependencies.some((d) => d.includes('Identity') || d.includes('Provisioning')) &&
    !phase1.includes(j),
  )
  // Phase 3: Finance Policy Engine v2 + Payroll
  const phase3 = journeys.filter((j) =>
    j.dependencies.some((d) => d.includes('Finance') || d.includes('Payroll')) &&
    !phase1.includes(j) && !phase2.includes(j),
  )
  // Phase 4: everything else (Calendar OAuth, EAP, Insurance, Legal)
  const phase4 = journeys.filter((j) =>
    !phase1.includes(j) && !phase2.includes(j) && !phase3.includes(j),
  )

  return [
    {
      name: 'Phase 1 — Quick wins',
      description:
        'Journeys that only require existing modules + the Policy Engine pattern. Build first. Demonstrates the model.',
      journeys: phase1,
      totalWeeks: phase1.reduce((s, j) => s + j.effortWeeks, 0),
    },
    {
      name: 'Phase 2 — Identity & Provisioning orchestrator',
      description:
        'Build the atomic provisioning engine. Unlocks Day-1 onboarding, IT support flows, device lifecycle journeys.',
      journeys: phase2,
      totalWeeks: phase2.reduce((s, j) => s + j.effortWeeks, 0),
    },
    {
      name: 'Phase 3 — Finance Policy Engine v2 & Payroll integration',
      description:
        'Extend the Policy Engine to comp, leave, travel. Wire payroll posting for auto-deductions and reimbursements.',
      journeys: phase3,
      totalWeeks: phase3.reduce((s, j) => s + j.effortWeeks, 0),
    },
    {
      name: 'Phase 4 — External system connectors',
      description:
        'Calendar OAuth, EAP, benefits provider, and legal evidence module. Highest unlock value but longest lead time.',
      journeys: phase4,
      totalWeeks: phase4.reduce((s, j) => s + j.effortWeeks, 0),
    },
  ].filter((p) => p.journeys.length > 0)
}
