'use client'

/**
 * /eval — Journey Test Harness
 *
 * Lets you browse 299 journeys from the canonical catalog, filter by
 * persona/tier/difficulty, run an agent against any journey's trigger,
 * and score the result against the 4-check rubric.
 *
 * The catalog itself becomes executable instead of just descriptive.
 */

import { useMemo, useState } from 'react'
import {
  journeyCatalog,
  filterJourneys,
  getPersonas,
  scoreRubric,
  RUBRIC_CHECKS,
  type Journey,
  type Tier,
  type Verdict,
  type RubricResult,
  type RubricCheckId,
} from '@/data/journey-catalog'
import './eval.css'

const TIERS: Array<{ id: Tier; label: string; desc: string; color: string }> = [
  { id: 'T1', label: 'Tier 1', desc: 'Passes today', color: '#637D4B' },
  { id: 'T2', label: 'Tier 2', desc: '1–3 week build', color: '#3F789A' },
  { id: 'T3', label: 'Tier 3', desc: 'Deep build', color: '#A77A32' },
  { id: 'T4', label: 'Tier 4', desc: 'External system', color: '#B24B55' },
]

export default function EvalPage() {
  const [search, setSearch] = useState('')
  const [persona, setPersona] = useState<string>('')
  const [tier, setTier] = useState<Tier | ''>('')
  const [minWow, setMinWow] = useState<number>(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [scores, setScores] = useState<Record<string, RubricResult>>({})

  const personas = useMemo(() => getPersonas(), [])

  const filtered = useMemo(
    () =>
      filterJourneys({
        search: search || undefined,
        persona: persona || undefined,
        tier: tier || undefined,
        minWow: minWow || undefined,
      }),
    [search, persona, tier, minWow],
  )

  const selected = useMemo(
    () => (selectedId ? journeyCatalog.journeys.find((j) => j.id === selectedId) ?? null : null),
    [selectedId],
  )

  // Aggregate stats
  const stats = useMemo(() => {
    const total = filtered.length
    const byTier: Record<string, number> = { T1: 0, T2: 0, T3: 0, T4: 0 }
    for (const j of filtered) byTier[j.tier] = (byTier[j.tier] ?? 0) + 1
    return { total, byTier }
  }, [filtered])

  function updateScore(journeyId: string, check: RubricCheckId, value: 'pass' | 'fail' | 'na') {
    setScores((prev) => ({
      ...prev,
      [journeyId]: { ...(prev[journeyId] ?? {}), [check]: value },
    }))
  }

  function verdictFor(journey: Journey): Verdict {
    const r = scores[journey.id] ?? {}
    return scoreRubric(r as RubricResult)
  }

  return (
    <main className="eval">
      <header className="eval-header">
        <div>
          <p className="eval-eyebrow">Test Harness</p>
          <h1 className="eval-title">Journey Catalog Evaluator</h1>
          <p className="eval-sub">
            {journeyCatalog.meta.totalJourneys} journeys from the canonical Tempo catalog.
            Filter, run, score against the 4-check rubric.
          </p>
        </div>
        <a href="/eval/reports" className="eval-reports-link">Reports →</a>
      </header>

      {/* Stats strip */}
      <section className="eval-stats">
        <div className="eval-stat">
          <strong>{stats.total}</strong>
          <span>journeys{stats.total !== journeyCatalog.meta.totalJourneys ? ' filtered' : ''}</span>
        </div>
        {TIERS.map((t) => (
          <div key={t.id} className="eval-stat eval-stat-tier" style={{ '--tier-color': t.color } as React.CSSProperties}>
            <strong>{stats.byTier[t.id] ?? 0}</strong>
            <span>{t.label} · {t.desc}</span>
          </div>
        ))}
      </section>

      {/* Filters */}
      <section className="eval-filters">
        <input
          type="search"
          placeholder="Search by trigger, persona, category…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="eval-search"
        />
        <select value={persona} onChange={(e) => setPersona(e.target.value)} className="eval-select">
          <option value="">All personas</option>
          {personas.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={tier} onChange={(e) => setTier(e.target.value as Tier | '')} className="eval-select">
          <option value="">All tiers</option>
          {TIERS.map((t) => <option key={t.id} value={t.id}>{t.label} — {t.desc}</option>)}
        </select>
        <select value={minWow} onChange={(e) => setMinWow(Number(e.target.value))} className="eval-select">
          <option value={0}>All wow</option>
          <option value={5}>5★ only</option>
          <option value={4}>4★+</option>
          <option value={3}>3★+</option>
        </select>
      </section>

      {/* Two-pane layout */}
      <section className="eval-pane">
        <div className="eval-list">
          {filtered.slice(0, 200).map((j) => {
            const v = verdictFor(j)
            return (
              <button
                key={j.id}
                type="button"
                className={`eval-row ${selectedId === j.id ? 'is-selected' : ''}`}
                onClick={() => setSelectedId(j.id)}
              >
                <span className={`eval-pill eval-pill-${j.tier.toLowerCase()}`}>{j.tier}</span>
                <span className="eval-row-id">{j.id}</span>
                <span className="eval-row-trigger">{j.trigger}</span>
                <span className="eval-row-meta">
                  {j.persona}/{j.sub} · {j.diff} · {'★'.repeat(j.wow)}
                </span>
                <span className={`eval-verdict eval-verdict-${v}`}>{verdictLabel(v)}</span>
              </button>
            )
          })}
          {filtered.length > 200 && (
            <p className="eval-list-note">
              Showing first 200 of {filtered.length}. Refine filters to narrow.
            </p>
          )}
        </div>

        <div className="eval-detail">
          {selected ? (
            <JourneyDetail
              journey={selected}
              rubric={scores[selected.id] ?? {}}
              onScore={(check, value) => updateScore(selected.id, check, value)}
            />
          ) : (
            <div className="eval-empty">
              <p>Select a journey to view detail and score against the rubric.</p>
              <p className="eval-empty-sub">
                Try a Tier 1 routine first to confirm Tempo passes the rubric on the easy cases.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

// ─── Journey detail + scoring UI ────────────────────────────────────

function JourneyDetail({
  journey,
  rubric,
  onScore,
}: {
  journey: Journey
  rubric: RubricResult
  onScore: (check: RubricCheckId, value: 'pass' | 'fail' | 'na') => void
}) {
  const v = scoreRubric(rubric)

  return (
    <article className="eval-card">
      <header className="eval-card-header">
        <div className="eval-card-meta">
          <span className={`eval-pill eval-pill-${journey.tier.toLowerCase()}`}>{journey.tier}</span>
          <span className="eval-card-id">{journey.id}</span>
          <span className="eval-card-persona">{journey.persona} · {journey.sub}</span>
          <span className="eval-card-diff">{journey.diff}</span>
          <span className="eval-card-wow">{'★'.repeat(journey.wow)}</span>
        </div>
        <p className="eval-card-trigger">{journey.trigger}</p>
      </header>

      <section className="eval-card-section">
        <h3 className="eval-card-h3">Today&apos;s friction</h3>
        <p>{journey.friction}</p>
      </section>

      <section className="eval-card-section">
        <h3 className="eval-card-h3">Tempo frictionless flow</h3>
        <p>{journey.flow}</p>
      </section>

      <section className="eval-card-section eval-card-section-grid">
        <div>
          <h4 className="eval-card-h4">Systems touched</h4>
          <p className="eval-card-tag">{journey.systems}</p>
        </div>
        <div>
          <h4 className="eval-card-h4">AI capabilities tested</h4>
          <p className="eval-card-tag">{journey.ai}</p>
        </div>
      </section>

      <section className="eval-card-section eval-tier-callout">
        <h4 className="eval-card-h4">Tier classification</h4>
        <p>
          <strong className={`eval-tier-label eval-tier-label-${journey.tier.toLowerCase()}`}>{journey.tier}</strong> — {journey.tierReason}
        </p>
      </section>

      {/* Run prompt */}
      <section className="eval-card-section">
        <h3 className="eval-card-h3">Run this test</h3>
        <p className="eval-card-runprompt">
          Open the agent (or relevant page) and present this trigger verbatim. Observe the agent&apos;s
          response and the system events it produces. Score below.
        </p>
        <a
          href={`/chat?prompt=${encodeURIComponent(journey.trigger)}`}
          className="eval-run-btn"
        >
          Run in Chat →
        </a>
      </section>

      {/* Rubric */}
      <section className="eval-card-section">
        <header className="eval-rubric-head">
          <h3 className="eval-card-h3">Score against the rubric</h3>
          <span className={`eval-verdict eval-verdict-${v} eval-verdict-large`}>{verdictLabel(v)}</span>
        </header>
        <div className="eval-rubric">
          {RUBRIC_CHECKS.map((check) => {
            const current = rubric[check.id] ?? 'unscored'
            return (
              <div key={check.id} className="eval-rubric-row">
                <div className="eval-rubric-meta">
                  <p className="eval-rubric-label">{check.label}</p>
                  <p className="eval-rubric-q">{check.question}</p>
                  <p className="eval-rubric-fail">
                    <em>Fail if:</em> {check.failIf}
                  </p>
                </div>
                <div className="eval-rubric-actions">
                  {(['pass', 'fail', 'na'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => onScore(check.id, v)}
                      className={`eval-score-btn eval-score-${v} ${current === v ? 'is-active' : ''}`}
                    >
                      {v === 'na' ? 'N/A' : v}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </article>
  )
}

function verdictLabel(v: Verdict): string {
  switch (v) {
    case 'pass': return 'PASS'
    case 'partial': return 'PARTIAL'
    case 'fail': return 'FAIL'
    case 'unscored': return 'UNSCORED'
  }
}
