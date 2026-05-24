import './learn.css'

export const metadata = {
  title: 'Tempo — Work, integrated.',
  description:
    'The first AI-native platform integrating HR, Finance, IT and Operations under one quiet layer of intelligence.',
}

export default function LearnPage() {
  return (
    <main className="learn" aria-label="Tempo · Learn more">
      <a href="/" className="learn-logo tempo-wordmark" aria-label="Tempo home">
        tempo<span className="tempo-beat">.</span>
      </a>

      <a href="/" className="learn-back" aria-label="Back to start">
        <span aria-hidden="true">←</span>
        <span className="learn-back-label">Back</span>
      </a>

      {/* ── Section 1 — Hero ────────────────────────────────────────── */}
      <section className="learn-section learn-hero" aria-labelledby="learn-hero-heading">
        <p className="learn-eyebrow">
          <span className="learn-eyebrow-rule" aria-hidden="true" />
          A new beginning for work
        </p>
        <h1 id="learn-hero-heading" className="learn-display">
          Work,<br />integrated.
        </h1>
        <p className="learn-hero-lede">
          The first AI-native platform that runs HR, Finance, IT and Operations
          as one continuous layer — built for work that is quieter, sharper, and
          finally seamless.
        </p>
        <div className="learn-scroll-cue" aria-hidden="true">
          <span className="learn-scroll-cue-line" />
        </div>
      </section>

      {/* ── Section 2 — The premise ─────────────────────────────────── */}
      <section className="learn-section" aria-labelledby="learn-premise-heading">
        <p className="learn-eyebrow">
          <span className="learn-eyebrow-rule" aria-hidden="true" />
          The premise
        </p>
        <h2 id="learn-premise-heading" className="learn-h">
          Until now,<br />every system had its own seam.
        </h2>
        <div className="learn-flow">
          <p>HR talked to no one.</p>
          <p>Finance forgot the people behind the numbers.</p>
          <p>IT operated in the dark.</p>
          <p>Operations carried what nothing else could see.</p>
        </div>
      </section>

      {/* ── Section 3 — The four domains ────────────────────────────── */}
      <section className="learn-section" aria-labelledby="learn-four-heading">
        <p className="learn-eyebrow">
          <span className="learn-eyebrow-rule" aria-hidden="true" />
          One platform · Four domains
        </p>
        <h2 id="learn-four-heading" className="learn-h">
          HR.<br />Finance.<br />IT.<br />Operations.
        </h2>
        <p className="learn-line">
          One quiet layer beneath them — connecting every record, every action,
          every decision.
        </p>
      </section>

      {/* ── Section 4 — AI-native ───────────────────────────────────── */}
      <section className="learn-section" aria-labelledby="learn-ai-heading">
        <p className="learn-eyebrow">
          <span className="learn-eyebrow-rule" aria-hidden="true" />
          AI-native, not AI-added
        </p>
        <h2 id="learn-ai-heading" className="learn-h">
          Built around<br />intelligence —<br />
          <span className="learn-h-accent">not bolted on.</span>
        </h2>
        <p className="learn-line">
          Every action you take, every record you change, every decision you
          weigh — guided by the context already inside Tempo. The intelligence
          isn&apos;t a feature. It&apos;s the foundation.
        </p>
      </section>

      {/* ── Section 5 — Delight ─────────────────────────────────────── */}
      <section className="learn-section" aria-labelledby="learn-delight-heading">
        <p className="learn-eyebrow">
          <span className="learn-eyebrow-rule" aria-hidden="true" />
          The point
        </p>
        <h2 id="learn-delight-heading" className="learn-display learn-display-quiet">
          Work that<br />
          <em>disappears.</em>
        </h2>
        <p className="learn-line">
          So the work that matters can begin.
        </p>
      </section>

      {/* ── Section 6 — Close ───────────────────────────────────────── */}
      <section className="learn-section learn-close" aria-labelledby="learn-close-heading">
        <p className="learn-eyebrow">
          <span className="learn-eyebrow-rule" aria-hidden="true" />
          Begin
        </p>
        <h2 id="learn-close-heading" className="learn-h">
          When you&apos;re ready.
        </h2>
        <a href="/login" className="learn-cta">
          Sign in
          <span className="learn-cta-arrow" aria-hidden="true">→</span>
        </a>
        <p className="learn-credit">
          Built in Lagos for the work that builds tomorrow&apos;s economies.
        </p>
      </section>
    </main>
  )
}
