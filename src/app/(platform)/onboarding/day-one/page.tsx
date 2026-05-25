'use client'

/**
 * /onboarding/day-one — The First Morning
 *
 * What a new joiner sees the moment they log in on Day 1. Single screen.
 * Closed loop. Tempo voice. The journey J002 "First morning logging in
 * for the first time" passes here.
 *
 * Design moves applied:
 *   1. Context retention — never asks for what we know
 *   2. Screen exit — every action is on this page or one-tap away
 *   3. Approval gate — no manager approval needed for any first-day step
 *   4. Closed loop — explicit readiness panel + clear next-three-things
 */

import { useEffect, useState } from 'react'
import './day-one.css'

interface DayOneResponse {
  profile: {
    fullName: string
    preferredName: string
    title: string
    department: string
    city: string
    managerName: string
    photoUrl: string | null
    email: string
  }
  readiness: {
    ssoTestedOvernight: boolean
    readyForFirstDay: boolean
    readinessScore: number
    systems: {
      sso: { name: string; ready: boolean; testedAt: string | null; detail: string | null }
      email: { name: string; ready: boolean; testedAt: string | null; detail: string | null }
      slack: { name: string; ready: boolean; testedAt: string | null; detail: string | null }
      calendar: { name: string; ready: boolean; testedAt: string | null; detail: string | null }
      equipment: { name: string; ready: boolean; testedAt: string | null; detail: string | null }
      apps: Array<{ name: string; ready: boolean; testedAt: string | null; detail: string | null }>
    }
    blockers: string[]
  }
  buddy: {
    buddy: {
      fullName: string
      title: string
      country: string
      photoUrl: string | null
      slackHandle: string
      matchScore: number
      reasons: string[]
    } | null
    introMessage: string
    buddyNotified: boolean
  }
  peers: {
    peers: Array<{
      fullName: string
      title: string
      country: string
      photoUrl: string | null
      reasons: string[]
    }>
    suggestedTime: string | null
  }
  tasks: Array<{
    id: string
    title: string
    description: string
    deepLink: string
    priority: number
    estimatedMinutes: number
    category: 'sign' | 'meet' | 'learn' | 'setup'
  }>
  greeting: string
}

export default function DayOnePage() {
  const [data, setData] = useState<DayOneResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/onboarding/day-one')
      .then((r) => r.json())
      .then((d) => setData(d as DayOneResponse))
      .catch((e) => setError(String(e)))
  }, [])

  if (error) {
    return (
      <main className="day-one day-one-error">
        <p>Something went wrong: {error}</p>
      </main>
    )
  }

  if (!data) {
    return (
      <main className="day-one day-one-loading">
        <div className="tempo-beat-pulse" role="status" aria-label="Loading">
          <span /><span /><span /><span />
        </div>
      </main>
    )
  }

  return (
    <main className="day-one" aria-label="Day 1 — First morning">
      <Header data={data} />
      <ReadinessPanel readiness={data.readiness} />
      <TasksPanel tasks={data.tasks} />
      <BuddyPanel buddy={data.buddy} />
      <PeersPanel peers={data.peers} />
      <ClosingLine profile={data.profile} />
    </main>
  )
}

// ─── Header ──────────────────────────────────────────────────────────
function Header({ data }: { data: DayOneResponse }) {
  return (
    <header className="day-one-header">
      <p className="day-one-eyebrow">
        <span className="tempo-beat-divider" aria-hidden="true"><span /><span /></span>
        Day 1 · {data.profile.city}
      </p>
      <h1 className="day-one-h1">
        {data.greeting}, {data.profile.preferredName}.
      </h1>
      <p className="day-one-lede">
        Welcome to Ecobank. You&apos;re joining as {data.profile.title}, reporting to {data.profile.managerName}.
        Everything you need is ready.
      </p>
    </header>
  )
}

// ─── Readiness panel ─────────────────────────────────────────────────
function ReadinessPanel({ readiness }: { readiness: DayOneResponse['readiness'] }) {
  const systems = readiness.systems
  const allItems = [
    systems.sso,
    systems.email,
    systems.slack,
    systems.calendar,
    systems.equipment,
    ...systems.apps,
  ]
  const greenCount = allItems.filter((s) => s.ready).length
  const pct = Math.round((greenCount / allItems.length) * 100)

  return (
    <section className="day-one-panel day-one-readiness">
      <header className="day-one-panel-head">
        <h2 className="day-one-h2">All systems ready</h2>
        <span className="day-one-panel-stat">
          {greenCount}/{allItems.length} · {pct}% · tested overnight
        </span>
      </header>
      <ul className="day-one-system-list">
        {allItems.map((sys) => (
          <li key={sys.name} className={`day-one-system ${sys.ready ? 'is-ready' : 'is-pending'}`}>
            <span className="day-one-system-status" aria-hidden="true">
              {sys.ready ? '✓' : '◦'}
            </span>
            <span className="day-one-system-name">{sys.name}</span>
            {sys.detail && <span className="day-one-system-detail">{sys.detail}</span>}
          </li>
        ))}
      </ul>
    </section>
  )
}

// ─── Tasks panel — the three Day-1 things ───────────────────────────
function TasksPanel({ tasks }: { tasks: DayOneResponse['tasks'] }) {
  return (
    <section className="day-one-panel day-one-tasks">
      <header className="day-one-panel-head">
        <h2 className="day-one-h2">Three things today</h2>
        <span className="day-one-panel-stat">
          {tasks.reduce((s, t) => s + t.estimatedMinutes, 0)} min total
        </span>
      </header>
      <ol className="day-one-task-list">
        {tasks.map((task) => (
          <li key={task.id} className="day-one-task">
            <span className={`day-one-task-num day-one-task-cat-${task.category}`}>
              {task.priority}
            </span>
            <div className="day-one-task-body">
              <p className="day-one-task-title">{task.title}</p>
              <p className="day-one-task-desc">{task.description}</p>
            </div>
            <a href={task.deepLink} className="day-one-task-cta">
              {task.category === 'sign' ? 'Open' :
                task.category === 'meet' ? 'View invite' :
                  task.category === 'learn' ? 'Start' : 'Go'}
              <span aria-hidden="true"> →</span>
            </a>
          </li>
        ))}
      </ol>
    </section>
  )
}

// ─── Buddy panel ─────────────────────────────────────────────────────
function BuddyPanel({ buddy }: { buddy: DayOneResponse['buddy'] }) {
  if (!buddy.buddy) return null
  const b = buddy.buddy
  return (
    <section className="day-one-panel day-one-buddy">
      <header className="day-one-panel-head">
        <h2 className="day-one-h2">Your buddy</h2>
        {buddy.buddyNotified && (
          <span className="day-one-panel-stat day-one-stat-positive">Slack-notified · 8:02am</span>
        )}
      </header>
      <article className="day-one-person">
        {b.photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={b.photoUrl} alt={`${b.fullName}, ${b.title}`} className="day-one-person-photo" />
        )}
        <div className="day-one-person-body">
          <p className="day-one-person-name">{b.fullName}</p>
          <p className="day-one-person-title">{b.title} · {b.country}</p>
          <p className="day-one-person-slack">{b.slackHandle}</p>
          <blockquote className="day-one-person-quote">{buddy.introMessage}</blockquote>
          <p className="day-one-person-reasons">
            <strong>Why Yemi:</strong> {b.reasons.join(' · ')}
          </p>
        </div>
      </article>
    </section>
  )
}

// ─── Peers panel — virtual coffee ────────────────────────────────────
function PeersPanel({ peers }: { peers: DayOneResponse['peers'] }) {
  if (peers.peers.length === 0) return null
  return (
    <section className="day-one-panel day-one-peers">
      <header className="day-one-panel-head">
        <h2 className="day-one-h2">Coffee with two peers</h2>
        {peers.suggestedTime && (
          <span className="day-one-panel-stat">Suggested: {formatDate(peers.suggestedTime)}</span>
        )}
      </header>
      <p className="day-one-peers-lede">
        Optional. We held a 30-minute slot on day 3. Either of these would be a good start.
      </p>
      <div className="day-one-peer-grid">
        {peers.peers.map((p) => (
          <article key={p.fullName} className="day-one-peer">
            {p.photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.photoUrl} alt={`${p.fullName}, ${p.title}`} className="day-one-peer-photo" />
            )}
            <p className="day-one-peer-name">{p.fullName}</p>
            <p className="day-one-peer-title">{p.title} · {p.country}</p>
            <p className="day-one-peer-reasons">{p.reasons[0]}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

// ─── Closing line ────────────────────────────────────────────────────
function ClosingLine({ profile }: { profile: DayOneResponse['profile'] }) {
  return (
    <footer className="day-one-footer">
      <p>
        That&apos;s your first morning. {profile.managerName} will check in at 4pm.
        Slack <strong>@tempo</strong> any time — we&apos;re here.
      </p>
      <p className="day-one-credit">Built in Lagos for the work that builds tomorrow&apos;s economies.</p>
    </footer>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────
function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}
