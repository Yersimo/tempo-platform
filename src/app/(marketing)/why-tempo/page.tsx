'use client'

import { useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'

type CellValue = string | { text: string; color?: string }

const comparisonHeaders = ['Feature', 'Tempo', 'Rippling', 'Workday', 'BambooHR', 'Deel', 'SAP SF']

const comparisonRows: { feature: string; values: CellValue[] }[] = [
  { feature: 'Modules', values: ['50+', '30+', '40+', '12', '5', '25+'] },
  { feature: 'AI Assistant', values: [
    { text: '\u2705', color: '#16a34a' },
    { text: '\u2014', color: '#a0a0ad' },
    { text: '\u2705 (Sana)', color: '#16a34a' },
    { text: '\u2014', color: '#a0a0ad' },
    { text: '\u2014', color: '#a0a0ad' },
    { text: '\u2014', color: '#a0a0ad' },
  ]},
  { feature: 'Africa Payroll', values: [
    { text: 'Deep', color: '#16a34a' },
    { text: 'Basic', color: '#d97706' },
    { text: 'Basic', color: '#d97706' },
    { text: '\u2014', color: '#a0a0ad' },
    { text: 'EOR', color: '#16a34a' },
    { text: 'Basic', color: '#d97706' },
  ]},
  { feature: 'India/Brazil Statutory', values: [
    { text: 'Full', color: '#16a34a' },
    { text: 'Full', color: '#16a34a' },
    { text: 'Full', color: '#16a34a' },
    { text: '\u2014', color: '#a0a0ad' },
    { text: 'EOR', color: '#16a34a' },
    { text: 'Full', color: '#16a34a' },
  ]},
  { feature: 'Bank Reconciliation', values: [
    { text: '\u2705', color: '#16a34a' },
    { text: '\u2014', color: '#a0a0ad' },
    { text: '\u2014', color: '#a0a0ad' },
    { text: '\u2014', color: '#a0a0ad' },
    { text: '\u2014', color: '#a0a0ad' },
    { text: 'Partial', color: '#d97706' },
  ]},
  { feature: 'Multi-Entity Consolidation', values: [
    { text: '\u2705', color: '#16a34a' },
    { text: '\u2014', color: '#a0a0ad' },
    { text: '\u2705', color: '#16a34a' },
    { text: '\u2014', color: '#a0a0ad' },
    { text: '\u2014', color: '#a0a0ad' },
    { text: '\u2705', color: '#16a34a' },
  ]},
  { feature: 'Event Cascade (visible)', values: [
    { text: '\u2705', color: '#16a34a' },
    { text: '\u2014', color: '#a0a0ad' },
    { text: '\u2014', color: '#a0a0ad' },
    { text: '\u2014', color: '#a0a0ad' },
    { text: '\u2014', color: '#a0a0ad' },
    { text: '\u2014', color: '#a0a0ad' },
  ]},
  { feature: 'Knowledge Base AI', values: [
    { text: '\u2705', color: '#16a34a' },
    { text: '\u2014', color: '#a0a0ad' },
    { text: '\u2705 (Sana)', color: '#16a34a' },
    { text: '\u2014', color: '#a0a0ad' },
    { text: '\u2014', color: '#a0a0ad' },
    { text: '\u2014', color: '#a0a0ad' },
  ]},
  { feature: 'Starting Price', values: ['Contact', 'Contact', '$$$$$', '$$$', '$49/mo', '$$$$$'] },
  { feature: 'Implementation', values: [
    { text: 'Days', color: '#16a34a' },
    { text: 'Weeks', color: '#d97706' },
    { text: 'Months', color: '#dc2626' },
    { text: 'Days', color: '#16a34a' },
    { text: 'Hours', color: '#16a34a' },
    { text: 'Months', color: '#dc2626' },
  ]},
]

const reasons = [
  {
    title: 'One data model, not 15 acquisitions',
    desc: 'Workday and SAP grew by acquiring companies. Their data is siloed. Tempo was built as one system from Day 1.',
  },
  {
    title: 'Africa-first, not Africa-afterthought',
    desc: 'Ghana PAYE + SSNIT, Nigeria PAYE + NHF, Kenya PAYE + NHIF. Real statutory compliance, not just tax brackets.',
  },
  {
    title: 'AI that works on YOUR data',
    desc: 'Tempo AI answers questions from your real employee data. Upload your policies and employees get instant answers. No external API calls. Your data stays in your tenant.',
  },
  {
    title: 'See the integration, don\'t just trust the brochure',
    desc: 'Our event cascade shows downstream actions in real-time. Hire someone \u2014 watch 9 systems update automatically. No other platform makes integration visible.',
  },
  {
    title: 'Enterprise depth at mid-market speed',
    desc: 'SOC 2 framework, SAML SSO, SCIM provisioning, multi-entity consolidation. But you can be live in days, not months.',
  },
]

export default function WhyTempoPage() {
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

  function getCellText(val: CellValue): string {
    return typeof val === 'string' ? val : val.text
  }
  function getCellColor(val: CellValue): string | undefined {
    return typeof val === 'string' ? undefined : val.color
  }

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
        <div className="l-hero-badge l-fade-up">Why Tempo</div>
        <h1 className="l-fade-up l-d1" style={{ fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 300, letterSpacing: '-0.03em', color: '#fff', lineHeight: 1.1, marginBottom: 20 }}>
          Why companies choose Tempo<br />over the <em style={{ fontStyle: 'normal', color: '#fb923c' }}>alternatives.</em>
        </h1>
        <div className="l-hero-ctas l-fade-up l-d3">
          <a href="#demo" className="l-btn-primary" onClick={scrollToDemo}>Request a Demo</a>
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section className="l-section l-section-light">
        <div className="l-section-inner">
          <div className="l-section-tag l-reveal">Comparison</div>
          <div className="l-section-title l-reveal" style={{ transitionDelay: '.05s' }}>
            Feature-by-feature. No spin.
          </div>
          <div className="l-reveal" style={{ overflowX: 'auto', marginTop: 48 }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 14,
              minWidth: 800,
            }}>
              <thead>
                <tr>
                  {comparisonHeaders.map((h, i) => (
                    <th key={h} style={{
                      textAlign: 'left',
                      padding: '14px 16px',
                      borderBottom: '2px solid rgba(0,0,0,0.08)',
                      fontSize: 13,
                      fontWeight: 600,
                      color: i === 1 ? '#ea580c' : '#111118',
                      background: i === 1 ? '#fff7ed' : 'transparent',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.feature}>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(0,0,0,0.04)', fontWeight: 500, color: '#111118' }}>
                      {row.feature}
                    </td>
                    {row.values.map((val, i) => (
                      <td key={i} style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid rgba(0,0,0,0.04)',
                        color: getCellColor(val) || '#6b6b78',
                        fontWeight: i === 0 ? 600 : 400,
                        background: i === 0 ? '#fff7ed' : 'transparent',
                      }}>
                        {getCellText(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 5 REASONS */}
      <section className="l-section" style={{ background: 'var(--dk)', color: '#fff' }}>
        <div className="l-section-inner">
          <div className="l-section-tag l-reveal">5 Reasons</div>
          <div className="l-section-title l-reveal" style={{ color: '#fff', transitionDelay: '.05s' }}>
            Why Tempo wins.
          </div>
          <div style={{ display: 'grid', gap: 32, marginTop: 48 }} className="l-stagger-children l-reveal">
            {reasons.map((r, i) => (
              <div key={r.title} style={{
                display: 'grid',
                gridTemplateColumns: '48px 1fr',
                gap: 20,
                alignItems: 'start',
              }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: 'rgba(234,88,12,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  fontWeight: 700,
                  color: '#fb923c',
                  flexShrink: 0,
                }}>
                  {i + 1}
                </div>
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 600, color: '#fff', marginBottom: 8 }}>
                    &ldquo;{r.title}&rdquo;
                  </h3>
                  <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>
                    {r.desc}
                  </p>
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
            See why teams switch to Tempo.
          </div>
          <div style={{ fontSize: 16, color: 'rgba(255,255,255,.3)', fontWeight: 300, marginBottom: 32, maxWidth: 400, margin: '0 auto 32px', lineHeight: 1.6 }}>
            Request a personalized demo. We&apos;ll show you side-by-side how Tempo compares.
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
