'use client'

import { useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'

const modules = [
  { name: 'General Ledger', desc: 'Double-entry enforcement, auto-JE, period close', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
  { name: 'Invoicing', desc: 'AR aging, multi-level approval, dunning', icon: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z' },
  { name: 'Budgets', desc: 'Variance analysis, department-level tracking', icon: 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { name: 'Expenses', desc: 'Claude Vision OCR, corporate card matching, GPS mileage', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  { name: 'Bill Pay', desc: 'ACH/Wire/Check, recurring payments, approval queue', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
  { name: 'Corporate Cards', desc: 'Virtual/physical, spend limits, reconciliation', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  { name: 'Bank Feeds', desc: 'Plaid integration, 6-tier auto-matching engine', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { name: 'Consolidation', desc: 'Multi-entity, FX conversion, IC elimination', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
  { name: 'Revenue Recognition', desc: 'ASC 606 5-step model, deferred revenue', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
  { name: 'Transfer Pricing', desc: 'OECD Master File, Local File, CbCR', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { name: 'Procurement', desc: 'Three-way PO matching, goods receipts', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { name: 'Global Spend', desc: 'Multi-currency, FX transactions, regional breakdown', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { name: 'Board Reports', desc: 'Auto-generated quarterly packs, 4 templates', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { name: 'Workforce Planning', desc: 'Rolling 12-month forecast, scenario comparison', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
]

const statements = [
  { name: 'Trial Balance', desc: 'Debits = credits, always', icon: '=' },
  { name: 'Income Statement', desc: 'Revenue vs expenses, any period', icon: '\u2195' },
  { name: 'Balance Sheet', desc: 'A = L + E verification', icon: '\u2261' },
]

export default function FinanceProductPage() {
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
        <div className="l-hero-badge l-fade-up">Finance Platform</div>
        <h1 className="l-fade-up l-d1" style={{ fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 300, letterSpacing: '-0.03em', color: '#fff', lineHeight: 1.1, marginBottom: 20 }}>
          Finance tools that a CFO<br />would actually <em style={{ fontStyle: 'normal', color: '#fb923c' }}>use.</em>
        </h1>
        <p className="l-hero-sub l-fade-up l-d2">
          Double-entry accounting, multi-entity consolidation, and<br />
          bank reconciliation &mdash; built into your HR platform.
        </p>
        <div className="l-hero-ctas l-fade-up l-d3">
          <a href="#demo" className="l-btn-primary" onClick={scrollToDemo}>Request a Demo</a>
        </div>
      </section>

      {/* MODULE GRID */}
      <section className="l-section l-section-light">
        <div className="l-section-inner">
          <div className="l-section-tag l-reveal">14 Finance Modules</div>
          <div className="l-section-title l-reveal" style={{ transitionDelay: '.05s' }}>
            A complete finance suite.<br />Not an add-on.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20, marginTop: 48 }} className="l-stagger-children l-reveal">
            {modules.map((m) => (
              <div key={m.name} style={{
                background: '#fff',
                border: '1px solid rgba(0,0,0,0.06)',
                borderRadius: 14,
                padding: 28,
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

      {/* FINANCIAL STATEMENTS */}
      <section className="l-section" style={{ background: 'var(--dk)', color: '#fff' }}>
        <div className="l-section-inner">
          <div className="l-section-tag l-reveal">Financial Statements</div>
          <div className="l-section-title l-reveal" style={{ color: '#fff', transitionDelay: '.05s' }}>
            Generated from your real data,<br />not a spreadsheet.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24, marginTop: 48 }} className="l-reveal">
            {statements.map((s) => (
              <div key={s.name} style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 14,
                padding: 32,
                textAlign: 'center',
              }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: 'rgba(234,88,12,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  fontSize: 24,
                  color: '#fb923c',
                  fontWeight: 700,
                }}>
                  {s.icon}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 8 }}>{s.name}</h3>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>{s.desc}</p>
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
            Ready to upgrade your finance stack?
          </div>
          <div style={{ fontSize: 16, color: 'rgba(255,255,255,.3)', fontWeight: 300, marginBottom: 32, maxWidth: 400, margin: '0 auto 32px', lineHeight: 1.6 }}>
            See double-entry accounting, bank reconciliation, and consolidation in one demo.
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
