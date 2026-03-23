'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import Link from 'next/link'

interface Journey {
  title: string
  badge?: string
  summary: string
  steps: string[]
}

const journeys: Journey[] = [
  {
    title: 'Hire-to-Perform',
    badge: 'Most Popular',
    summary: 'From approved headcount to 90-day review \u2014 12 modules, zero gaps.',
    steps: [
      'Headcount approved in workforce planning',
      'Requisition created in recruiting',
      'Candidate hired via ATS',
      'Employee record created in HRIS',
      'Onboarding journey triggered',
      'SSO account provisioned',
      'Device assigned from IT inventory',
      'Training auto-enrolled in LMS',
      'Mentor matched via AI',
      'Welcome moment published',
      'Org chart updated automatically',
      '90-day performance review scheduled',
    ],
  },
  {
    title: 'Employee Exit',
    summary: 'From resignation to zero access in hours.',
    steps: [
      'Resignation submitted by employee',
      'Manager notified with exit checklist',
      'Exit interview scheduled',
      'Knowledge transfer plan created',
      'Device return initiated',
      'SSO access scheduled for revocation',
      'Final payroll calculated',
      'Benefits termination processed',
      'Exit survey sent',
      'Alumni record created',
    ],
  },
  {
    title: 'Predict & Retain',
    summary: 'AI flags a flight risk, manager acts before it\u2019s too late.',
    steps: [
      'AI detects flight risk signals',
      'Manager alert triggered',
      'Compensation gap identified',
      'Engagement survey scores reviewed',
      'Retention plan created',
      'Salary adjustment proposed',
      'Development plan assigned',
      'Mentor program enrollment',
      'Follow-up review scheduled',
    ],
  },
  {
    title: 'Close the Books',
    summary: 'Month-end financial close \u2014 from transactions to board report.',
    steps: [
      'Payroll journal entries auto-posted',
      'Bank feeds reconciled',
      'Expense reports approved and posted',
      'Accounts receivable aged',
      'Revenue recognized per ASC 606',
      'Intercompany eliminations applied',
      'Trial balance verified (Dr = Cr)',
      'Financial statements generated',
      'Board report pack assembled',
    ],
  },
  {
    title: 'Develop & Promote',
    summary: 'High-potential employee: 9-box to promotion, tracked end-to-end.',
    steps: [
      'Employee placed in 9-box high-potential',
      'Development plan created',
      'Leadership training auto-enrolled',
      'Mentor assigned from senior pool',
      'Stretch project allocated',
      'Mid-cycle performance check-in',
      'Compensation review triggered',
      'Promotion nominated by manager',
      'Calibration committee approves',
      'New role and comp effective-dated',
    ],
  },
  {
    title: 'Global Expand',
    summary: 'First hire in a new country \u2014 compliance, payroll, benefits, onboarding.',
    steps: [
      'New country entity created',
      'Statutory compliance rules configured',
      'Payroll calendar and rules set up',
      'Benefits package defined',
      'Employment contract generated',
      'First employee hired',
      'Onboarding journey localized',
      'Tax registration completed',
      'First payroll run and verified',
      'Reporting consolidated with parent',
    ],
  },
]

export default function JourneysPage() {
  const navRef = useRef<HTMLElement>(null)
  const [expanded, setExpanded] = useState<number | null>(0)

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
        <div className="l-hero-badge l-fade-up">Customer Journeys</div>
        <h1 className="l-fade-up l-d1" style={{ fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 300, letterSpacing: '-0.03em', color: '#fff', lineHeight: 1.1, marginBottom: 20 }}>
          6 journeys that prove<br /><em style={{ fontStyle: 'normal', color: '#fb923c' }}>integration.</em>
        </h1>
        <p className="l-hero-sub l-fade-up l-d2">
          Each journey traces one business event through every module it touches &mdash;<br />
          automatically, without manual intervention.
        </p>
        <div className="l-hero-ctas l-fade-up l-d3">
          <a href="#demo" className="l-btn-primary" onClick={scrollToDemo}>Request a Demo</a>
        </div>
      </section>

      {/* JOURNEY CARDS */}
      <section className="l-section l-section-light">
        <div className="l-section-inner">
          <div className="l-section-tag l-reveal">End-to-End Journeys</div>
          <div className="l-section-title l-reveal" style={{ transitionDelay: '.05s' }}>
            One event. Many modules.<br />Zero manual steps.
          </div>
          <div style={{ display: 'grid', gap: 20, marginTop: 48 }} className="l-stagger-children l-reveal">
            {journeys.map((j, idx) => (
              <div key={j.title} style={{
                background: '#fff',
                border: '1px solid rgba(0,0,0,0.06)',
                borderRadius: 14,
                overflow: 'hidden',
                transition: 'all .2s',
              }}>
                <button
                  onClick={() => setExpanded(expanded === idx ? null : idx)}
                  style={{
                    width: '100%',
                    padding: '24px 28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: expanded === idx ? '#ea580c' : '#fff7ed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                      fontWeight: 700,
                      color: expanded === idx ? '#fff' : '#ea580c',
                      transition: 'all .2s',
                      flexShrink: 0,
                    }}>
                      {idx + 1}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111118' }}>{j.title}</h3>
                        {j.badge && (
                          <span style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: '#ea580c',
                            background: '#fff7ed',
                            padding: '3px 10px',
                            borderRadius: 100,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}>
                            {j.badge}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 14, color: '#6b6b78', marginTop: 4 }}>{j.summary}</p>
                    </div>
                  </div>
                  <svg
                    style={{
                      width: 20,
                      height: 20,
                      color: '#a0a0ad',
                      transition: 'transform .2s',
                      transform: expanded === idx ? 'rotate(180deg)' : 'rotate(0deg)',
                      flexShrink: 0,
                    }}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                {expanded === idx && (
                  <div style={{
                    padding: '0 28px 28px',
                    borderTop: '1px solid rgba(0,0,0,0.04)',
                  }}>
                    <div style={{ display: 'grid', gap: 0, paddingTop: 20 }}>
                      {j.steps.map((step, si) => (
                        <div key={si} style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                            <div style={{
                              width: 28,
                              height: 28,
                              borderRadius: 8,
                              background: '#fff7ed',
                              border: '1px solid rgba(234,88,12,0.15)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 12,
                              fontWeight: 600,
                              color: '#ea580c',
                            }}>
                              {si + 1}
                            </div>
                            {si < j.steps.length - 1 && (
                              <div style={{ width: 1, height: 24, background: 'rgba(234,88,12,0.12)' }} />
                            )}
                          </div>
                          <div style={{ paddingTop: 4, paddingBottom: si < j.steps.length - 1 ? 12 : 0, fontSize: 14, color: '#6b6b78', lineHeight: 1.5 }}>
                            {step}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
            Ready to see these journeys live?
          </div>
          <div style={{ fontSize: 16, color: 'rgba(255,255,255,.3)', fontWeight: 300, marginBottom: 32, maxWidth: 440, margin: '0 auto 32px', lineHeight: 1.6 }}>
            Book a demo and we&apos;ll walk you through any journey with your company&apos;s data.
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
