'use client'

import { useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'

const modules = [
  { name: 'People & HRIS', desc: 'Single employee record, custom fields, effective-dated history', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { name: 'Recruiting', desc: '10-stage ATS, AI screening, career site, DEI analytics', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
  { name: 'Performance', desc: '360 feedback, calibration, OKR alignment, goal templates', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { name: 'Learning', desc: 'SCORM LMS, 12+ tabs, auto-enrollment, certificates', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { name: 'Compensation', desc: 'Comp bands, equity grants, STIP calculator, pay equity', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { name: 'Succession', desc: '9-box grid, bench strength, flight risk, talent reviews', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { name: 'Skills', desc: 'Gap analysis, proficiency tracking, development plans', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
  { name: 'Engagement', desc: 'Pulse surveys, eNPS, action plans, sentiment analysis', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
  { name: 'Onboarding', desc: '6-step wizard, localized journeys, auto-enrollment', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
  { name: 'Offboarding', desc: 'Checklists by type, access revocation, exit surveys', icon: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1' },
  { name: 'Org Chart', desc: 'Interactive tree, span of control, department filtering', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { name: 'Team Calendar', desc: 'Gantt leave view, conflict alerts, coverage planning', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { name: 'Mentoring', desc: 'AI matching, 6 program types, ROI measurement', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  { name: 'Talent Marketplace', desc: 'Internal gigs, skill matching, career paths', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { name: 'Moments', desc: '12 celebration types, automated recognition', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
]

const journeySteps = [
  'Hire approved', 'HRIS record', 'Onboarding journey', 'SSO provisioned',
  'Device assigned', 'Training enrolled', 'Mentor matched', 'Moment created',
  'Org chart updated', '90-day review', 'Skills assessed', 'Survey sent',
]

const aiQueries = [
  { q: 'Who\'s on leave today?', a: 'Instant answer from real data' },
  { q: 'My leave balance', a: '18 annual, 10 sick, 3 personal' },
  { q: 'What if Kwame leaves?', a: 'Impact analysis with succession data' },
]

export default function HRProductPage() {
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const onScroll = () => {
      navRef.current?.classList.toggle('scrolled', window.scrollY > 50)
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible')
            obs.unobserve(e.target)
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    )
    document.querySelectorAll('.l-reveal,.l-reveal-left,.l-reveal-right,.l-reveal-scale,.l-stagger-children').forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  const scrollToDemo = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  return (
    <div className="landing">
      {/* NAV */}
      <nav className="l-nav" ref={navRef}>
        <div className="l-nav-left">
          <Link href="/" className="l-nav-logo">
            <span className="l-nav-wordmark" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>tempo<span style={{ color: '#E8590C' }}>.</span></span>
          </Link>
          <div className="l-nav-links">
            <Link href="/products/hr">HR</Link>
            <Link href="/products/payroll">Payroll</Link>
            <Link href="/products/finance">Finance</Link>
            <Link href="/why-tempo">Why Tempo</Link>
            <Link href="/customer-journeys">Journeys</Link>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/login" className="l-nav-signin" style={{ fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>Sign In</Link>
          <a href="#demo" className="l-nav-cta" onClick={scrollToDemo}>Request a Demo</a>
        </div>
      </nav>

      {/* HERO */}
      <section className="l-hero" style={{ paddingBottom: 80 }}>
        <div className="l-hero-glow" />
        <div className="l-hero-badge l-fade-up">HR Platform</div>
        <h1 className="l-fade-up l-d1" style={{ fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 300, letterSpacing: '-0.03em', color: '#fff', lineHeight: 1.1, marginBottom: 20 }}>
          People management that<br />actually <em style={{ fontStyle: 'normal', color: '#fb923c' }}>manages people.</em>
        </h1>
        <p className="l-hero-sub l-fade-up l-d2">
          From hire to retire, every step automated. Every record connected.<br />
          Every decision informed by real data.
        </p>
        <div className="l-hero-ctas l-fade-up l-d3">
          <a href="#demo" className="l-btn-primary" onClick={scrollToDemo}>Request a Demo</a>
        </div>
      </section>

      {/* MODULE GRID */}
      <section className="l-section l-section-light">
        <div className="l-section-inner">
          <div className="l-section-tag l-reveal">15 HR Modules</div>
          <div className="l-section-title l-reveal" style={{ transitionDelay: '.05s' }}>
            Everything your HR team needs.<br />Nothing they don&apos;t.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20, marginTop: 48 }} className="l-stagger-children l-reveal">
            {modules.map((m) => (
              <div key={m.name} style={{
                background: '#fff',
                border: '1px solid rgba(0,0,0,0.06)',
                borderRadius: 14,
                padding: 28,
                transition: 'all .2s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg style={{ width: 20, height: 20, color: '#ea580c' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d={m.icon} />
                    </svg>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111118' }}>{m.name}</h3>
                </div>
                <p style={{ fontSize: 14, color: '#6b6b78', lineHeight: 1.6 }}>{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HIRE-TO-PERFORM JOURNEY */}
      <section className="l-section" style={{ background: 'var(--dk)', color: '#fff' }}>
        <div className="l-section-inner">
          <div className="l-section-tag l-reveal">Key Feature Spotlight</div>
          <div className="l-section-title l-reveal" style={{ color: '#fff', transitionDelay: '.05s' }}>
            The Hire-to-Perform Journey
          </div>
          <p className="l-section-desc l-reveal" style={{ color: 'rgba(255,255,255,.35)', transitionDelay: '.1s' }}>
            12 steps. 12 modules. Zero manual handoffs.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 48 }} className="l-reveal" >
            {journeySteps.map((step, i) => (
              <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  background: 'rgba(234,88,12,0.12)',
                  border: '1px solid rgba(234,88,12,0.2)',
                  borderRadius: 12,
                  padding: '12px 20px',
                  fontSize: 14,
                  color: '#fb923c',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                }}>
                  <span style={{ fontSize: 11, opacity: 0.5, marginRight: 8 }}>{i + 1}</span>
                  {step}
                </div>
                {i < journeySteps.length - 1 && (
                  <svg style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.15)', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            ))}
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32, marginTop: 64, textAlign: 'center' }} className="l-reveal">
            <div>
              <div style={{ fontSize: 48, fontWeight: 300, color: '#fb923c', letterSpacing: '-0.02em' }}>15</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>HR modules</div>
            </div>
            <div>
              <div style={{ fontSize: 48, fontWeight: 300, color: '#fb923c', letterSpacing: '-0.02em' }}>53/53</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>QA lifecycle tests pass</div>
            </div>
            <div>
              <div style={{ fontSize: 48, fontWeight: 300, color: '#fb923c', letterSpacing: '-0.02em' }}>208</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>AI query patterns</div>
            </div>
          </div>
        </div>
      </section>

      {/* TEMPO AI FOR HR */}
      <section className="l-section l-section-alt">
        <div className="l-section-inner">
          <div className="l-section-tag l-reveal">Tempo AI for HR</div>
          <div className="l-section-title l-reveal" style={{ transitionDelay: '.05s' }}>
            Ask anything. Get real answers.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24, marginTop: 48 }} className="l-reveal">
            {aiQueries.map((item) => (
              <div key={item.q} style={{
                background: '#0f1117',
                borderRadius: 14,
                padding: 28,
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontFamily: 'monospace' }}>
                  &gt; {item.q}
                </div>
                <div style={{ fontSize: 15, color: '#fb923c', fontWeight: 500 }}>
                  {item.a}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="l-cta-section" id="demo">
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div><span style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-.02em', color: 'rgba(255,255,255,.4)' }}>tempo<span style={{ color: '#E8590C' }}>.</span></span></div>
          <div style={{ marginTop: 20, fontSize: 'clamp(28px,4vw,48px)', fontWeight: 300, color: '#fff', letterSpacing: '-.025em', marginBottom: 12 }}>
            Ready to transform your HR?
          </div>
          <div style={{ fontSize: 16, color: 'rgba(255,255,255,.3)', fontWeight: 300, marginBottom: 32, maxWidth: 400, margin: '0 auto 32px', lineHeight: 1.6 }}>
            Request a personalized demo. We&apos;ll show you every module with your company&apos;s data.
          </div>
          <a href="mailto:hello@tempo.work" className="l-btn-primary" style={{ fontSize: 16, padding: '14px 36px' }}>Request a Demo</a>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.15)', marginTop: 14 }}>Or email hello@tempo.work</div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="l-footer">
        <div className="l-footer-inner">
          <div>
            <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-.02em', color: 'rgba(255,255,255,.3)' }}>tempo<span style={{ color: 'rgba(234,88,12,.5)' }}>.</span></span>
          </div>
          <div className="l-footer-links">
            <Link href="/products/hr">HR</Link>
            <Link href="/products/payroll">Payroll</Link>
            <Link href="/products/finance">Finance</Link>
            <Link href="/why-tempo">Why Tempo</Link>
            <Link href="/customer-journeys">Journeys</Link>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.1)' }}>&copy; {new Date().getFullYear()} Tempo</div>
        </div>
      </footer>
    </div>
  )
}
