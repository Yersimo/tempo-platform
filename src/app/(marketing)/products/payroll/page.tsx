'use client'

import { useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'

const countries = [
  { flag: '\u{1F1EC}\u{1F1ED}', name: 'Ghana', details: 'PAYE (GRA tiered rates), SSNIT (5.5% employee / 13% employer)' },
  { flag: '\u{1F1F3}\u{1F1EC}', name: 'Nigeria', details: 'PAYE, NHF, NSITF, Form H1 generation' },
  { flag: '\u{1F1F0}\u{1F1EA}', name: 'Kenya', details: 'PAYE, NHIF, NSSF, P9A tax deduction card' },
  { flag: '\u{1F1FF}\u{1F1E6}', name: 'South Africa', details: 'PAYE, UIF, SDL' },
  { flag: '\u{1F1EE}\u{1F1F3}', name: 'India', details: 'PF (EPF/EPS/EDLI), ESI, Professional Tax (11 states), TDS (old + new regime), Gratuity, Statutory Bonus, Form 16, ECR' },
  { flag: '\u{1F1E7}\u{1F1F7}', name: 'Brazil', details: 'INSS (progressive), FGTS (8%), IRRF, 13th Salary, F\u00e9rias + 1/3, Vale-Transporte, CLT, eSocial events' },
]

const paymentFormats = [
  { name: 'NACHA', region: 'USA' },
  { name: 'SEPA', region: 'Europe' },
  { name: 'BACS', region: 'UK' },
  { name: 'NIBSS', region: 'Nigeria' },
  { name: 'GhIPSS', region: 'Ghana' },
  { name: 'Kenya RTGS', region: 'Kenya' },
  { name: 'Generic CSV', region: 'Global' },
]

const automationSteps = [
  'Run payroll',
  'GL journal entries auto-post',
  'Bank payment file generated',
  'Tax filings updated',
  'Payslips delivered',
  'Budget actuals updated',
  'Finance channel notified',
]

export default function PayrollProductPage() {
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
        <div className="l-hero-badge l-fade-up">Global Payroll</div>
        <h1 className="l-fade-up l-d1" style={{ fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 300, letterSpacing: '-0.03em', color: '#fff', lineHeight: 1.1, marginBottom: 20 }}>
          Payroll that actually<br /><em style={{ fontStyle: 'normal', color: '#fb923c' }}>runs payroll.</em>
        </h1>
        <p className="l-hero-sub l-fade-up l-d2">
          101 countries. 7 payment formats. Real statutory compliance &mdash;<br />
          not just tax brackets.
        </p>
        <div className="l-hero-ctas l-fade-up l-d3">
          <a href="#demo" className="l-btn-primary" onClick={scrollToDemo}>Request a Demo</a>
        </div>
      </section>

      {/* COUNTRY COMPLIANCE */}
      <section className="l-section l-section-light">
        <div className="l-section-inner">
          <div className="l-section-tag l-reveal">Country Compliance</div>
          <div className="l-section-title l-reveal" style={{ transitionDelay: '.05s' }}>
            Deep statutory compliance.<br />Not surface-level tax tables.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))', gap: 20, marginTop: 48 }} className="l-stagger-children l-reveal">
            {countries.map((c) => (
              <div key={c.name} style={{
                background: '#fff',
                border: '1px solid rgba(0,0,0,0.06)',
                borderRadius: 14,
                padding: 28,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <span style={{ fontSize: 28 }}>{c.flag}</span>
                  <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111118' }}>{c.name}</h3>
                </div>
                <p style={{ fontSize: 14, color: '#6b6b78', lineHeight: 1.7 }}>{c.details}</p>
              </div>
            ))}
          </div>
          <div className="l-reveal" style={{ textAlign: 'center', marginTop: 32 }}>
            <span style={{ fontSize: 15, color: '#ea580c', fontWeight: 600 }}>+ 95 more countries</span>
          </div>
        </div>
      </section>

      {/* PAYMENT FILE FORMATS */}
      <section className="l-section l-section-alt">
        <div className="l-section-inner">
          <div className="l-section-tag l-reveal">Payment File Formats</div>
          <div className="l-section-title l-reveal" style={{ transitionDelay: '.05s' }}>
            Generate the right file for every bank.
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center', marginTop: 48 }} className="l-reveal">
            {paymentFormats.map((f) => (
              <div key={f.name} style={{
                background: '#fff',
                border: '1px solid rgba(0,0,0,0.06)',
                borderRadius: 12,
                padding: '16px 28px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#111118' }}>{f.name}</div>
                <div style={{ fontSize: 13, color: '#a0a0ad', marginTop: 4 }}>{f.region}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PAYROLL AUTOMATION */}
      <section className="l-section" style={{ background: 'var(--dk)', color: '#fff' }}>
        <div className="l-section-inner">
          <div className="l-section-tag l-reveal">Payroll Automation</div>
          <div className="l-section-title l-reveal" style={{ color: '#fff', transitionDelay: '.05s' }}>
            One click. Seven downstream actions.
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 48 }} className="l-reveal">
            {automationSteps.map((step, i) => (
              <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  background: 'rgba(234,88,12,0.12)',
                  border: '1px solid rgba(234,88,12,0.2)',
                  borderRadius: 12,
                  padding: '14px 22px',
                  fontSize: 14,
                  color: '#fb923c',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                }}>
                  <span style={{ fontSize: 11, opacity: 0.5, marginRight: 8 }}>{i + 1}</span>
                  {step}
                </div>
                {i < automationSteps.length - 1 && (
                  <svg style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.15)', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AUTO-JE INTEGRATION */}
      <section className="l-section l-section-light">
        <div className="l-section-inner">
          <div className="l-section-tag l-reveal">Auto-JE Integration</div>
          <div className="l-section-title l-reveal" style={{ transitionDelay: '.05s' }}>
            Payroll posts to your general ledger. Automatically.
          </div>
          <div className="l-reveal" style={{
            maxWidth: 560,
            margin: '48px auto 0',
            background: '#0f1117',
            borderRadius: 14,
            padding: 32,
            border: '1px solid rgba(255,255,255,0.06)',
            fontFamily: 'monospace',
            fontSize: 14,
            lineHeight: 2,
          }}>
            <div style={{ color: 'rgba(255,255,255,0.35)', marginBottom: 12, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-sans)' }}>
              Journal Entry &mdash; March 2026 Payroll
            </div>
            <div style={{ color: '#fb923c' }}>Dr Salary Expense <span style={{ float: 'right', color: 'rgba(255,255,255,0.6)' }}>GHS 23,556.89</span></div>
            <div style={{ color: 'rgba(255,255,255,0.4)', paddingLeft: 24 }}>Cr PAYE Tax Payable <span style={{ float: 'right', color: 'rgba(255,255,255,0.6)' }}>GHS 3,420.15</span></div>
            <div style={{ color: 'rgba(255,255,255,0.4)', paddingLeft: 24 }}>Cr SSNIT Payable <span style={{ float: 'right', color: 'rgba(255,255,255,0.6)' }}>GHS 1,295.63</span></div>
            <div style={{ color: 'rgba(255,255,255,0.4)', paddingLeft: 24 }}>Cr Cash/Bank <span style={{ float: 'right', color: 'rgba(255,255,255,0.6)' }}>GHS 18,841.11</span></div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="l-cta-section" id="demo">
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div><span style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-.02em', color: 'rgba(255,255,255,.4)' }}>tempo<span style={{ color: '#E8590C' }}>.</span></span></div>
          <div style={{ marginTop: 20, fontSize: 'clamp(28px,4vw,48px)', fontWeight: 300, color: '#fff', letterSpacing: '-.025em', marginBottom: 12 }}>
            Ready to run real payroll?
          </div>
          <div style={{ fontSize: 16, color: 'rgba(255,255,255,.3)', fontWeight: 300, marginBottom: 32, maxWidth: 400, margin: '0 auto 32px', lineHeight: 1.6 }}>
            Request a demo and we&apos;ll show you payroll in your country with your statutory rules.
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
