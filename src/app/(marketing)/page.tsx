'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

/* ─── Module data for the module showcase ─── */
const modulePillars = [
  {
    title: 'People & HR',
    desc: 'The complete employee lifecycle from hire to retire.',
    color: '#ea580c',
    modules: [
      'People', 'Recruiting', 'Performance', 'Learning', 'Compensation',
      'Succession', 'Skills', 'Org Chart', 'Mentoring', 'Engagement',
    ],
    href: '/people',
  },
  {
    title: 'Finance & Operations',
    desc: 'Payroll, accounting, and financial operations unified.',
    color: '#2563eb',
    modules: [
      'Payroll', 'Invoices', 'General Ledger', 'Budgets', 'Expenses', 'Travel',
      'Bank Feeds', 'Consolidation', 'Revenue', 'Procurement',
    ],
    href: '/payroll',
  },
  {
    title: 'IT & Security',
    desc: 'Devices, identity, and compliance from one control plane.',
    color: '#16a34a',
    modules: [
      'Devices', 'Identity', 'Apps', 'Passwords', 'Compliance',
      'Automation', 'Documents', 'Chat',
    ],
    href: '/it/devices',
  },
]

/* ─── Journey data ─── */
const journeys = [
  { num: '01', title: 'Hire-to-Perform', desc: '12 modules, 1 click. From offer letter to first performance review.', modules: '12 modules' },
  { num: '02', title: 'Employee Exit', desc: 'Secure in hours, not weeks. Access revoked, assets returned, knowledge transferred.', modules: '8 modules' },
  { num: '03', title: 'Predict & Retain', desc: 'AI flags risks before resignations. Intervene with data, not guesswork.', modules: 'AI-powered' },
  { num: '04', title: 'Close the Books', desc: 'Board pack in 30 seconds. Financial close with one click.', modules: '6 modules' },
  { num: '05', title: 'Develop & Promote', desc: '9-box to promotion, tracked. Skills, mentoring, and succession in one flow.', modules: '5 modules' },
  { num: '06', title: 'Global Expand', desc: 'New country in days, not months. Statutory compliance built in.', modules: '96+ countries' },
]


export default function LandingPage() {
  const navRef = useRef<HTMLElement>(null)
  const statGridRef = useRef<HTMLDivElement>(null)
  const tableRef = useRef<HTMLDivElement>(null)
  const cascadeRef = useRef<HTMLDivElement>(null)
  const queryRef = useRef<HTMLDivElement>(null)
  const typedQueryRef = useRef<HTMLDivElement>(null)
  const queryResultsRef = useRef<HTMLDivElement>(null)
  const trustRef = useRef<HTMLDivElement>(null)
  const [heroModule, setHeroModule] = useState('dashboard')

  /* ─── Nav scroll effect ─── */
  useEffect(() => {
    const onScroll = () => {
      navRef.current?.classList.toggle('scrolled', window.scrollY > 50)
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* ─── Scroll reveal observer ─── */
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

  /* ─── Hero dashboard animations ─── */
  useEffect(() => {
    const t1 = setTimeout(() => statGridRef.current?.classList.add('animated'), 800)
    const t2 = setTimeout(() => tableRef.current?.classList.add('animated'), 1200)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  /* ─── Cascade demo (Workflow 1) ─── */
  useEffect(() => {
    const el = cascadeRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const items = e.target.querySelectorAll('.l-cascade-item')
            items.forEach((item, i) => {
              setTimeout(() => item.classList.add('animated'), i * 300)
            })
            setTimeout(() => {
              e.target.querySelectorAll('.l-flow-dot').forEach((d) => d.classList.add('pulse'))
            }, items.length * 300 + 200)
            obs.unobserve(e.target)
          }
        })
      },
      { threshold: 0.3 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  /* ─── Query typing demo ─── */
  useEffect(() => {
    const el = queryRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const queryText = 'How many people are on leave this week?'
            const tEl = typedQueryRef.current
            if (!tEl) return
            let i = 0
            tEl.innerHTML = '<span class="l-type-cursor"></span>'
            const typeInterval = setInterval(() => {
              if (i < queryText.length) {
                tEl.innerHTML =
                  '<span style="color:rgba(255,255,255,.6)">' +
                  queryText.substring(0, i + 1) +
                  '</span><span class="l-type-cursor"></span>'
                i++
              } else {
                clearInterval(typeInterval)
                setTimeout(() => {
                  tEl.innerHTML = '<span style="color:rgba(255,255,255,.6)">' + queryText + '</span>'
                }, 600)
                setTimeout(() => {
                  if (queryResultsRef.current) queryResultsRef.current.style.opacity = '1'
                  document.querySelectorAll('.l-query-row').forEach((row, j) => {
                    setTimeout(() => row.classList.add('visible'), j * 150)
                  })
                }, 400)
              }
            }, 35)
            obs.unobserve(e.target)
          }
        })
      },
      { threshold: 0.3 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  /* ─── Trust stat counter ─── */
  useEffect(() => {
    const el = trustRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const stats = e.target.querySelectorAll<HTMLElement>('.l-trust-stat-val')
            stats.forEach((stat) => {
              const final = stat.dataset.final || stat.textContent || ''
              const numStr = final.replace(/[^0-9]/g, '')
              const suffix = final.replace(/[0-9]/g, '')
              const num = parseInt(numStr)
              if (isNaN(num)) return
              let current = 0
              const step = Math.max(1, Math.ceil(num / 30))
              const interval = setInterval(() => {
                current = Math.min(current + step, num)
                if (current >= num) {
                  clearInterval(interval)
                  stat.textContent = final
                } else {
                  stat.textContent = current + suffix
                }
              }, 30)
            })
            obs.unobserve(e.target)
          }
        })
      },
      { threshold: 0.4 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  /* ─── Smooth scroll handler ─── */
  const handleAnchorClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  return (
    <div className="landing">
      {/* ═══ NAV ═══ */}
      <nav className="l-nav" ref={navRef}>
        <div className="l-nav-left">
          <a href="#" className="l-nav-logo" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
            <span className="l-nav-wordmark" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>tempo<span style={{ color: '#E8590C' }}>.</span></span>
          </a>
          <div className="l-nav-links">
            <a href="#platform" onClick={(e) => handleAnchorClick(e, 'platform')}>Platform</a>
            <a href="#modules" onClick={(e) => handleAnchorClick(e, 'modules')}>Modules</a>
            <a href="#ai" onClick={(e) => handleAnchorClick(e, 'ai')}>AI</a>
            <a href="#security" onClick={(e) => handleAnchorClick(e, 'security')}>Security</a>
            <a href="/pricing" style={{ fontSize: 14, fontWeight: 400, color: 'rgba(255,255,255,.6)', textDecoration: 'none' }}>Pricing</a>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/login" className="l-nav-signin" style={{ fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>Sign In</a>
          <a href="/demo-request" className="l-nav-cta">Request a Demo</a>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION 1: HERO                                               */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="l-hero">
        <div className="l-hero-glow" />
        <div className="l-hero-badge l-fade-up">The Unified Workforce Platform</div>
        <h1 className="l-fade-up l-d1">
          One employee record.<br />
          50+ integrated modules.<br />
          Built for <em>global enterprise.</em>
        </h1>
        <p className="l-hero-sub l-fade-up l-d2">
          HR, payroll, finance, IT, and AI in one platform. One data layer. One permissions engine.<br className="hidden md:inline" />
          No Zapier. No spreadsheets. No manual sync.
        </p>
        <div className="l-hero-ctas l-fade-up l-d3">
          <a href="/demo-request" className="l-btn-primary">Request a Demo</a>
          <a href="/signup" className="l-btn-secondary">Start Free Trial &rarr;</a>
        </div>

        {/* Product Screenshot */}
        <div className="l-hero-product l-fade-up l-d4" style={{ position: 'relative' }}>
          {/* Floating notification cards */}
          <div className="l-float-card" style={{ position: 'absolute', top: '10%', right: '-5%', animation: 'floatUp 3s ease-in-out infinite', zIndex: 10 }}>
            <div style={{ background: 'white', borderRadius: 12, padding: '12px 18px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
              <span style={{ width: 32, height: 32, borderRadius: '50%', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 16, flexShrink: 0 }}>&#10003;</span>
              <div>
                <div style={{ fontWeight: 600, color: '#1a1a2e' }}>Payroll Processed</div>
                <div style={{ color: '#888', fontSize: 11 }}>12 employees &bull; GH&#x20B5;29,486.80</div>
              </div>
            </div>
          </div>

          <div className="l-float-card" style={{ position: 'absolute', bottom: '15%', left: '-3%', animation: 'floatUp 3.5s ease-in-out infinite 0.5s', zIndex: 10 }}>
            <div style={{ background: 'white', borderRadius: 12, padding: '12px 18px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
              <span style={{ width: 32, height: 32, borderRadius: '50%', background: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 16, flexShrink: 0 }}>&#9889;</span>
              <div>
                <div style={{ fontWeight: 600, color: '#1a1a2e' }}>New Hire Onboarded</div>
                <div style={{ color: '#888', fontSize: 11 }}>Akosua M. &bull; 9 systems updated</div>
              </div>
            </div>
          </div>

          <div className="l-float-card" style={{ position: 'absolute', top: '40%', right: '-8%', animation: 'floatUp 4s ease-in-out infinite 1s', zIndex: 10 }}>
            <div style={{ background: 'white', borderRadius: 12, padding: '12px 18px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
              <span style={{ width: 32, height: 32, borderRadius: '50%', background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 14, flexShrink: 0 }}>&#127891;</span>
              <div>
                <div style={{ fontWeight: 600, color: '#1a1a2e' }}>Certificate Issued</div>
                <div style={{ color: '#888', fontSize: 11 }}>Kwame B. &bull; AML Compliance</div>
              </div>
            </div>
          </div>

          <div className="l-hero-product-frame">
            <div className="l-topbar">
              <div className="l-topbar-dot" /><div className="l-topbar-dot" /><div className="l-topbar-dot" />
              <span style={{ flex: 1 }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,.12)' }}>tempo<span style={{ color: 'rgba(234,88,12,.3)' }}>.</span> &mdash; Dashboard</span>
              <span style={{ flex: 1 }} />
            </div>
            <div className="l-product-body">
              <div className="l-sidebar">
                <div className="l-sidebar-logo">
                  <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-.02em', color: '#fff' }}>tempo<span style={{ color: '#E8590C' }}>.</span></span>
                </div>
                <div className="l-sidebar-label">Modules</div>
                {([
                  { key: 'dashboard', label: 'Dashboard', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /></svg> },
                  { key: 'performance', label: 'Performance', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3,20 C5,14 9,10 11,8" /><path d="M6,21 C8,15 12,11 14,9 C16,7 18,5 21,4" /></svg> },
                  { key: 'compensation', label: 'Compensation', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12,2 L12,8" /><path d="M12,10 L12,14" /><rect x="4" y="14" width="16" height="8" rx="2" /></svg> },
                  { key: 'learning', label: 'Learning', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2,7 L12,2 L22,7 L12,12 Z" /></svg> },
                  { key: 'engagement', label: 'Engagement', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12,4 L12,12" /><circle cx="12" cy="18" r="2.5" /></svg> },
                  { key: 'analytics', label: 'Analytics', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3,22 L3,3" opacity=".3" /><path d="M3,22 L22,22" opacity=".3" /><path d="M6,16 C8,14 10,11 12,8 C14,5 18,4 20,4" /></svg> },
                ] as const).map((item) => (
                  <div
                    key={item.key}
                    className={`l-sidebar-item${heroModule === item.key ? ' active' : ''}`}
                    onClick={() => setHeroModule(item.key)}
                    style={{ cursor: 'pointer' }}
                  >
                    {item.icon}
                    {item.label}
                  </div>
                ))}
              </div>
              <div className="l-canvas">
                {heroModule === 'dashboard' && (<>
                  <div className="l-canvas-header">
                    <div>
                      <div className="l-canvas-title">Workforce Overview</div>
                      <div className="l-canvas-subtitle">Q4 2026 / All Regions</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <span style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, background: 'var(--lbg)', border: '1px solid var(--bd)', color: 'var(--lt3)', fontWeight: 500 }}>Export</span>
                      <span style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, background: 'var(--o)', color: '#fff', fontWeight: 500 }}>+ New Review</span>
                    </div>
                  </div>
                  <div className="l-stat-grid" ref={statGridRef}>
                    <div className="l-stat-card"><div className="l-stat-label">Review Completion</div><div className="l-stat-val orange">78%</div><div className="l-stat-delta">+12% vs Q3</div></div>
                    <div className="l-stat-card"><div className="l-stat-label">Active Employees</div><div className="l-stat-val">48,293</div><div className="l-stat-delta">+2.1% YoY</div></div>
                    <div className="l-stat-card"><div className="l-stat-label">Avg Comp Ratio</div><div className="l-stat-val">1.02</div><div className="l-stat-delta">At market</div></div>
                    <div className="l-stat-card"><div className="l-stat-label">Engagement (eNPS)</div><div className="l-stat-val">+42</div><div className="l-stat-delta">+8 vs H1</div></div>
                  </div>
                  <div className="l-demo-table" ref={tableRef}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr><th>Employee</th><th>Role</th><th>Region</th><th>Rating</th><th>Comp Ratio</th><th>Status</th></tr></thead>
                      <tbody>
                        <tr><td>Sarah Chen</td><td>VP Finance</td><td>Singapore</td><td>4.2</td><td>1.04</td><td><span className="l-tag l-tag-green">Complete</span></td></tr>
                        <tr><td>Marcus Weber</td><td>Dir. Engineering</td><td>Germany</td><td>3.8</td><td>0.91</td><td><span className="l-tag l-tag-amber">In Review</span></td></tr>
                        <tr><td>Fatou Diallo</td><td>HRBP</td><td>Senegal</td><td>4.5</td><td>0.97</td><td><span className="l-tag l-tag-green">Complete</span></td></tr>
                        <tr><td>Carlos Mendez</td><td>Country Head</td><td>Mexico</td><td>&mdash;</td><td>1.12</td><td><span className="l-tag l-tag-blue">Pending</span></td></tr>
                      </tbody>
                    </table>
                  </div>
                </>)}

                {heroModule === 'performance' && (<>
                  <div className="l-canvas-header">
                    <div><div className="l-canvas-title">Performance Reviews</div><div className="l-canvas-subtitle">Q4 2026 Cycle / EMEA Region</div></div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <span style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, background: 'var(--lbg)', border: '1px solid var(--bd)', color: 'var(--lt3)', fontWeight: 500 }}>Calibrate</span>
                      <span style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, background: 'var(--o)', color: '#fff', fontWeight: 500 }}>+ Start Review</span>
                    </div>
                  </div>
                  <div className="l-stat-grid animated">
                    <div className="l-stat-card"><div className="l-stat-label">Cycle Progress</div><div className="l-stat-val orange">73%</div><div className="l-stat-delta">164 of 224</div></div>
                    <div className="l-stat-card"><div className="l-stat-label">Avg Rating</div><div className="l-stat-val">3.8</div><div className="l-stat-delta">+0.2 vs H1</div></div>
                    <div className="l-stat-card"><div className="l-stat-label">Top Performers</div><div className="l-stat-val">38</div><div className="l-stat-delta">17% of pool</div></div>
                    <div className="l-stat-card"><div className="l-stat-label">Overdue</div><div className="l-stat-val" style={{ color: '#ef4444' }}>12</div><div className="l-stat-delta">5 managers</div></div>
                  </div>
                  <div className="l-demo-table animated">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr><th>Employee</th><th>Manager</th><th>Self Review</th><th>Manager Review</th><th>Rating</th><th>Status</th></tr></thead>
                      <tbody>
                        <tr><td>Amara Kone</td><td>O. Adeyemi</td><td><span className="l-tag l-tag-green">Done</span></td><td><span className="l-tag l-tag-green">Done</span></td><td>4.5</td><td><span className="l-tag l-tag-green">Complete</span></td></tr>
                        <tr><td>Kofi Asante</td><td>N. Okafor</td><td><span className="l-tag l-tag-green">Done</span></td><td><span className="l-tag l-tag-amber">Draft</span></td><td>&mdash;</td><td><span className="l-tag l-tag-amber">In Progress</span></td></tr>
                        <tr><td>Binta Sow</td><td>A. Darko</td><td><span className="l-tag l-tag-blue">Pending</span></td><td><span className="l-tag l-tag-blue">Pending</span></td><td>&mdash;</td><td><span className="l-tag l-tag-blue">Not Started</span></td></tr>
                        <tr><td>David Osei</td><td>O. Adeyemi</td><td><span className="l-tag l-tag-green">Done</span></td><td><span className="l-tag l-tag-green">Done</span></td><td>3.2</td><td><span className="l-tag l-tag-green">Complete</span></td></tr>
                      </tbody>
                    </table>
                  </div>
                </>)}

                {heroModule === 'compensation' && (<>
                  <div className="l-canvas-header">
                    <div><div className="l-canvas-title">Compensation Planning</div><div className="l-canvas-subtitle">2026 Annual Review / All Bands</div></div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <span style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, background: 'var(--lbg)', border: '1px solid var(--bd)', color: 'var(--lt3)', fontWeight: 500 }}>Bands</span>
                      <span style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, background: 'var(--o)', color: '#fff', fontWeight: 500 }}>+ Propose</span>
                    </div>
                  </div>
                  <div className="l-stat-grid animated">
                    <div className="l-stat-card"><div className="l-stat-label">Total Budget</div><div className="l-stat-val orange">$2.4M</div><div className="l-stat-delta">87% allocated</div></div>
                    <div className="l-stat-card"><div className="l-stat-label">Avg Increase</div><div className="l-stat-val">6.2%</div><div className="l-stat-delta">Market: 5.8%</div></div>
                    <div className="l-stat-card"><div className="l-stat-label">Below Band</div><div className="l-stat-val" style={{ color: '#ef4444' }}>23</div><div className="l-stat-delta">Priority review</div></div>
                    <div className="l-stat-card"><div className="l-stat-label">Equity Gap</div><div className="l-stat-val">2.1%</div><div className="l-stat-delta">-1.4% vs 2025</div></div>
                  </div>
                  <div className="l-demo-table animated">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr><th>Employee</th><th>Level</th><th>Current</th><th>Proposed</th><th>Comp Ratio</th><th>Status</th></tr></thead>
                      <tbody>
                        <tr><td>Fatou Diallo</td><td>P4</td><td>$62,000</td><td>$68,200</td><td><span style={{ color: 'var(--o)' }}>0.89</span></td><td><span className="l-tag l-tag-amber">Pending HR</span></td></tr>
                        <tr><td>Sarah Chen</td><td>P6</td><td>$148,000</td><td>$155,400</td><td>1.04</td><td><span className="l-tag l-tag-green">Approved</span></td></tr>
                        <tr><td>Marcus Weber</td><td>P5</td><td>$112,000</td><td>$121,000</td><td><span style={{ color: 'var(--o)' }}>0.91</span></td><td><span className="l-tag l-tag-amber">Manager Review</span></td></tr>
                        <tr><td>Kwame Asante</td><td>P3</td><td>$44,500</td><td>$48,200</td><td>0.97</td><td><span className="l-tag l-tag-green">Approved</span></td></tr>
                      </tbody>
                    </table>
                  </div>
                </>)}

                {heroModule === 'learning' && (<>
                  <div className="l-canvas-header">
                    <div><div className="l-canvas-title">Learning Paths</div><div className="l-canvas-subtitle">Active Programs / Q4 2026</div></div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <span style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, background: 'var(--lbg)', border: '1px solid var(--bd)', color: 'var(--lt3)', fontWeight: 500 }}>Catalog</span>
                      <span style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, background: 'var(--o)', color: '#fff', fontWeight: 500 }}>+ Create Path</span>
                    </div>
                  </div>
                  <div className="l-stat-grid animated">
                    <div className="l-stat-card"><div className="l-stat-label">Active Learners</div><div className="l-stat-val orange">1,247</div><div className="l-stat-delta">+18% vs Q3</div></div>
                    <div className="l-stat-card"><div className="l-stat-label">Courses</div><div className="l-stat-val">86</div><div className="l-stat-delta">12 new this Q</div></div>
                    <div className="l-stat-card"><div className="l-stat-label">Completion Rate</div><div className="l-stat-val">64%</div><div className="l-stat-delta">+9% vs Q3</div></div>
                    <div className="l-stat-card"><div className="l-stat-label">Skill Gaps Closed</div><div className="l-stat-val">142</div><div className="l-stat-delta">38 this month</div></div>
                  </div>
                  <div className="l-demo-table animated">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr><th>Program</th><th>Type</th><th>Enrolled</th><th>Completion</th><th>Avg Score</th><th>Status</th></tr></thead>
                      <tbody>
                        <tr><td>Leadership Essentials</td><td>Mandatory</td><td>342</td><td>78%</td><td>88/100</td><td><span className="l-tag l-tag-green">Active</span></td></tr>
                        <tr><td>Data Analytics</td><td>Elective</td><td>128</td><td>45%</td><td>92/100</td><td><span className="l-tag l-tag-green">Active</span></td></tr>
                        <tr><td>Compliance 2026</td><td>Mandatory</td><td>1,247</td><td>91%</td><td>85/100</td><td><span className="l-tag l-tag-amber">Closing</span></td></tr>
                        <tr><td>AI for Managers</td><td>Elective</td><td>64</td><td>12%</td><td>&mdash;</td><td><span className="l-tag l-tag-blue">New</span></td></tr>
                      </tbody>
                    </table>
                  </div>
                </>)}

                {heroModule === 'engagement' && (<>
                  <div className="l-canvas-header">
                    <div><div className="l-canvas-title">Employee Engagement</div><div className="l-canvas-subtitle">Pulse Survey / March 2026</div></div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <span style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, background: 'var(--lbg)', border: '1px solid var(--bd)', color: 'var(--lt3)', fontWeight: 500 }}>History</span>
                      <span style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, background: 'var(--o)', color: '#fff', fontWeight: 500 }}>+ New Survey</span>
                    </div>
                  </div>
                  <div className="l-stat-grid animated">
                    <div className="l-stat-card"><div className="l-stat-label">eNPS Score</div><div className="l-stat-val orange">+42</div><div className="l-stat-delta">+8 vs H1</div></div>
                    <div className="l-stat-card"><div className="l-stat-label">Response Rate</div><div className="l-stat-val">87%</div><div className="l-stat-delta">+5% vs prev</div></div>
                    <div className="l-stat-card"><div className="l-stat-label">Promoters</div><div className="l-stat-val" style={{ color: '#16a34a' }}>58%</div><div className="l-stat-delta">+4% QoQ</div></div>
                    <div className="l-stat-card"><div className="l-stat-label">Detractors</div><div className="l-stat-val" style={{ color: '#ef4444' }}>16%</div><div className="l-stat-delta">-3% QoQ</div></div>
                  </div>
                  <div className="l-demo-table animated">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr><th>Department</th><th>eNPS</th><th>Response</th><th>Top Theme</th><th>Trend</th><th>Action</th></tr></thead>
                      <tbody>
                        <tr><td>Engineering</td><td>+52</td><td>91%</td><td>Career growth</td><td style={{ color: '#16a34a' }}>+6</td><td><span className="l-tag l-tag-green">On Track</span></td></tr>
                        <tr><td>Sales</td><td>+28</td><td>84%</td><td>Work-life balance</td><td style={{ color: '#ef4444' }}>-4</td><td><span className="l-tag l-tag-amber">Action Plan</span></td></tr>
                        <tr><td>Operations</td><td>+45</td><td>89%</td><td>Team culture</td><td style={{ color: '#16a34a' }}>+12</td><td><span className="l-tag l-tag-green">On Track</span></td></tr>
                        <tr><td>Finance</td><td>+31</td><td>78%</td><td>Recognition</td><td style={{ color: 'var(--o)' }}>+1</td><td><span className="l-tag l-tag-blue">Monitoring</span></td></tr>
                      </tbody>
                    </table>
                  </div>
                </>)}

                {heroModule === 'analytics' && (<>
                  <div className="l-canvas-header">
                    <div><div className="l-canvas-title">Workforce Analytics</div><div className="l-canvas-subtitle">Cross-Module Insights / 2026</div></div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <span style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, background: 'var(--lbg)', border: '1px solid var(--bd)', color: 'var(--lt3)', fontWeight: 500 }}>Reports</span>
                      <span style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, background: 'var(--o)', color: '#fff', fontWeight: 500 }}>+ Query</span>
                    </div>
                  </div>
                  <div className="l-stat-grid animated">
                    <div className="l-stat-card"><div className="l-stat-label">Flight Risk</div><div className="l-stat-val" style={{ color: '#ef4444' }}>47</div><div className="l-stat-delta">High risk employees</div></div>
                    <div className="l-stat-card"><div className="l-stat-label">Attrition Rate</div><div className="l-stat-val orange">8.2%</div><div className="l-stat-delta">Industry: 12.1%</div></div>
                    <div className="l-stat-card"><div className="l-stat-label">Gender Pay Gap</div><div className="l-stat-val">2.1%</div><div className="l-stat-delta">-1.4% vs 2025</div></div>
                    <div className="l-stat-card"><div className="l-stat-label">Diversity Index</div><div className="l-stat-val">0.84</div><div className="l-stat-delta">+0.06 YoY</div></div>
                  </div>
                  <div className="l-demo-table animated">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr><th>Insight</th><th>Module</th><th>Impact</th><th>Confidence</th><th>Action</th><th>Priority</th></tr></thead>
                      <tbody>
                        <tr><td>Underpaid top performers</td><td>Comp + Perf</td><td>23 employees</td><td>94%</td><td>Salary review</td><td><span className="l-tag l-tag-amber">High</span></td></tr>
                        <tr><td>Manager skill gap</td><td>Learning</td><td>8 teams</td><td>87%</td><td>Training enrolled</td><td><span className="l-tag l-tag-amber">High</span></td></tr>
                        <tr><td>Engagement dip: Sales</td><td>Engagement</td><td>-4 eNPS</td><td>91%</td><td>Action plan</td><td><span className="l-tag l-tag-green">Medium</span></td></tr>
                        <tr><td>Succession gap: VP</td><td>Mentoring</td><td>3 roles</td><td>78%</td><td>Pipeline build</td><td><span className="l-tag l-tag-blue">Monitor</span></td></tr>
                      </tbody>
                    </table>
                  </div>
                </>)}
              </div>
            </div>
          </div>
        </div>

        {/* Integration Logo Bar + Stats */}
        <div style={{ maxWidth: 800, margin: '0 auto', paddingTop: 48, position: 'relative' }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.12em', color: 'rgba(255,255,255,.1)', textAlign: 'center', marginBottom: 16 }}>
            Works with your existing stack
          </div>
          <div className="l-logo-bar">
            <span>SAP</span><span>Workday</span><span>Oracle</span><span>Active Directory</span><span>Okta</span><span>Mercer</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 40, marginTop: 32 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,.7)', letterSpacing: '-.02em' }}>50K+</div>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.1em', color: 'rgba(255,255,255,.15)', marginTop: 2 }}>Employees</div>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,.06)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,.7)', letterSpacing: '-.02em' }}>80+</div>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.1em', color: 'rgba(255,255,255,.15)', marginTop: 2 }}>Countries</div>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,.06)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,.7)', letterSpacing: '-.02em' }}>99.9%</div>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.1em', color: 'rgba(255,255,255,.15)', marginTop: 2 }}>Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION 2: THE PROBLEM                                        */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="l-section l-section-light" style={{ paddingBottom: 60 }}>
        <div className="l-section-inner" style={{ textAlign: 'center', maxWidth: 720 }}>
          <div className="l-section-tag l-reveal">The Problem</div>
          <div className="l-section-title l-reveal" style={{ transitionDelay: '.05s', fontSize: 'clamp(28px,4vw,42px)' }}>
            The $4,200-per-employee problem.
          </div>
          <div className="l-reveal" style={{ transitionDelay: '.1s', fontSize: 16, color: '#666', lineHeight: 1.8, marginTop: 20 }}>
            The average company uses 12 HR tools. Each one has its own login, its own data, and its own version of the truth.
            When Sarah gets promoted, you update 8 systems manually.
            When Kwame leaves, IT access stays open for 3 weeks.
          </div>
          <div className="l-reveal" style={{ transitionDelay: '.2s', marginTop: 32, fontSize: 20, fontWeight: 600, color: '#ea580c', letterSpacing: '-.02em' }}>
            There&apos;s a better way.
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION 3: THE SOLUTION                                       */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="l-section l-section-dark" id="platform">
        <div className="l-section-inner">
          <div className="l-section-tag l-reveal">The Solution</div>
          <div className="l-section-title l-reveal" style={{ color: '#fff', transitionDelay: '.05s' }}>
            One platform. Zero gaps.
          </div>
          <div className="l-section-desc l-reveal" style={{ transitionDelay: '.1s', marginBottom: 40 }}>
            When you hire someone in Tempo, 9 things happen automatically.
          </div>

          <div className="l-reveal-scale" style={{ transitionDelay: '.2s', maxWidth: 640, margin: '0 auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} ref={cascadeRef}>
              {[
                'HRIS record created',
                'Onboarding journey assigned',
                'SSO access provisioned',
                'Device ordered',
                'Mandatory training enrolled',
                'Mentor matched',
                'Welcome moment created',
                '90-day review scheduled',
                'Pulse surveys queued',
              ].map((item, i) => (
                <div key={item} className="l-cascade-item" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: 'rgba(255,255,255,.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,.06)' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,rgba(234,88,12,.3),rgba(234,88,12,.6))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#fff', fontWeight: 600, flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,.6)', fontWeight: 400 }}>{item}</span>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: 28 }}>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,.2)', fontWeight: 300, lineHeight: 1.7 }}>
                No Zapier. No spreadsheets. No manual triggers.<br />
                This is what &ldquo;integrated&rdquo; actually means.
              </p>
              <a href="/demo-request" className="l-btn-primary" style={{ marginTop: 20, display: 'inline-block' }}>See it in action &rarr;</a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION: REAL RESULTS (warm background)                       */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section style={{ background: 'linear-gradient(135deg, #fff7ed 0%, #fef3c7 50%, #fff7ed 100%)', padding: '80px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 2, color: '#ea580c', fontWeight: 600, marginBottom: 0 }}>Real Results</p>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, color: '#1a1a2e', marginTop: 8 }}>Built for teams that move fast.</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32 }}>
            {/* Card 1 */}
            <div className="l-reveal" style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <div style={{ height: 200, background: 'linear-gradient(135deg, #1a1a2e, #2d2b55)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <div style={{ color: 'white', textAlign: 'center' }}>
                  <div style={{ fontSize: 48, fontWeight: 700 }}>12&rarr;1</div>
                  <div style={{ fontSize: 14, opacity: 0.8 }}>tools consolidated</div>
                </div>
              </div>
              <div style={{ padding: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1a1a2e' }}>Replace your entire HR stack</h3>
                <p style={{ fontSize: 14, color: '#666', marginTop: 8, lineHeight: 1.6 }}>One platform replaces BambooHR + Gusto + Lattice + Cornerstone + Expensify + Slack. One login. One invoice.</p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="l-reveal" style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', transitionDelay: '.1s' }}>
              <div style={{ height: 200, background: 'linear-gradient(135deg, #ea580c, #f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ color: 'white', textAlign: 'center' }}>
                  <div style={{ fontSize: 48, fontWeight: 700 }}>30s</div>
                  <div style={{ fontSize: 14, opacity: 0.9 }}>board pack generation</div>
                </div>
              </div>
              <div style={{ padding: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1a1a2e' }}>Board reports in seconds, not weeks</h3>
                <p style={{ fontSize: 14, color: '#666', marginTop: 8, lineHeight: 1.6 }}>Auto-generated quarterly packs with live data from every module. No more copy-pasting from 8 spreadsheets.</p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="l-reveal" style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', transitionDelay: '.2s' }}>
              <div style={{ height: 200, background: 'linear-gradient(135deg, #16a34a, #22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ color: 'white', textAlign: 'center' }}>
                  <div style={{ fontSize: 48, fontWeight: 700 }}>9</div>
                  <div style={{ fontSize: 14, opacity: 0.9 }}>auto-actions per hire</div>
                </div>
              </div>
              <div style={{ padding: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1a1a2e' }}>Hire once, update everywhere</h3>
                <p style={{ fontSize: 14, color: '#666', marginTop: 8, lineHeight: 1.6 }}>HRIS, onboarding, SSO, devices, training, mentoring, moment, review, surveys &mdash; all from one click.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION 4: MODULE SHOWCASE (3 pillars)                        */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="l-section l-section-alt" id="modules">
        <div className="l-section-inner">
          <div className="l-section-tag l-reveal">Platform</div>
          <div className="l-section-title l-reveal" style={{ transitionDelay: '.05s' }}>Everything your workforce needs.</div>
          <div className="l-section-desc l-reveal" style={{ transitionDelay: '.1s', marginBottom: 48 }}>
            50+ modules across three pillars. All sharing one data layer.
          </div>

          <div className="l-reveal-scale" style={{ transitionDelay: '.2s', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {modulePillars.map((pillar) => (
              <div key={pillar.title} style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 28, transition: 'box-shadow .3s' }}>
                <div style={{ width: 40, height: 4, borderRadius: 2, background: pillar.color, marginBottom: 16 }} />
                <h3 style={{ fontSize: 20, fontWeight: 700, color: '#111', marginBottom: 6, letterSpacing: '-.02em' }}>{pillar.title}</h3>
                <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6, marginBottom: 18 }}>{pillar.desc}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {pillar.modules.map((m) => (
                    <span key={m} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: '#f5f5f5', color: '#555', fontWeight: 500 }}>{m}</span>
                  ))}
                </div>
                <a href={pillar.href} style={{ display: 'inline-block', marginTop: 18, fontSize: 13, fontWeight: 600, color: pillar.color, textDecoration: 'none' }}>
                  Explore {pillar.title.split(' ')[0]} &rarr;
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION: TESTIMONIAL QUOTE                                    */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #2d2b55 100%)', padding: '80px 0', color: 'white' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, color: '#ea580c', marginBottom: 24, lineHeight: 1 }}>&ldquo;</div>
          <p className="l-reveal" style={{ fontSize: 'clamp(18px, 3vw, 24px)', lineHeight: 1.6, fontWeight: 300, fontStyle: 'italic', color: 'rgba(255,255,255,.8)' }}>
            The moment I saw one hire trigger 9 systems automatically, I knew we were looking at something different. This isn&apos;t an HR tool with integrations bolted on &mdash; it&apos;s a unified platform from the ground up.
          </p>
          <div style={{ marginTop: 32 }}>
            <p style={{ fontWeight: 600, fontSize: 16 }}>What our early adopters tell us</p>
            <p style={{ color: '#aaa', fontSize: 14, marginTop: 4 }}>HR Director, Pan-African Financial Services</p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION 5: TEMPO AI                                           */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="l-section l-section-dark" id="ai">
        <div className="l-section-inner">
          <div className="l-section-tag l-reveal">Tempo AI</div>
          <div className="l-section-title l-reveal" style={{ color: '#fff', transitionDelay: '.05s' }}>
            Meet Tempo AI.
          </div>
          <div className="l-section-desc l-reveal" style={{ transitionDelay: '.1s', marginBottom: 40 }}>
            Ask anything. Do anything. From anywhere.
          </div>

          {/* AI Demo */}
          <div className="l-demo-seq">
            <div className="l-demo-text l-reveal-left">
              <h3 style={{ color: '#fff' }}>Natural language, real actions.</h3>
              <p>Tempo AI understands your entire workforce. Ask questions, create records, run scenarios, and generate documents. All from one prompt. All connected to live data.</p>
              <a href="/demo-request" className="l-btn-primary" style={{ display: 'inline-block', marginTop: 16 }}>Try Tempo AI &rarr;</a>
            </div>
            <div className="l-demo-visual l-reveal-right" ref={queryRef}>
              <div style={{ padding: 28, width: '100%' }}>
                {/* Query input */}
                <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, border: '1px solid rgba(255,255,255,.06)' }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,.15)', marginBottom: 4 }}>Tempo AI</div>
                  <div ref={typedQueryRef} style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', fontWeight: 300, minHeight: 20 }}>
                    <span className="l-type-cursor" />
                  </div>
                </div>
                {/* AI Response */}
                <div ref={queryResultsRef} style={{ opacity: 0, transition: 'opacity .5s ease' }}>
                  <div style={{ background: 'rgba(234,88,12,.06)', border: '1px solid rgba(234,88,12,.15)', borderRadius: 10, padding: 16, marginBottom: 16 }}>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', lineHeight: 1.8 }}>
                      3 people are on leave this week:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                      {[
                        { name: 'Kwame Asante', type: 'Annual leave', days: '3 days' },
                        { name: 'Ama Darko', type: 'Sick leave', days: '2 days' },
                        { name: 'Nana Okafor', type: 'Personal leave', days: '1 day' },
                      ].map((row) => (
                        <div key={row.name} className="l-query-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8, fontSize: 12, color: 'rgba(255,255,255,.4)', padding: '6px 0', borderTop: '1px solid rgba(255,255,255,.04)' }}>
                          <div style={{ color: 'rgba(255,255,255,.6)' }}>{row.name}</div>
                          <div>{row.type}</div>
                          <div>{row.days}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* More examples */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ background: 'rgba(255,255,255,.03)', borderRadius: 8, padding: '10px 14px', border: '1px solid rgba(255,255,255,.04)' }}>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,.2)' }}>&ldquo;Create a job posting for Senior Analyst in Lagos&rdquo;</div>
                      <div style={{ fontSize: 12, color: '#16a34a', marginTop: 4 }}>Job posting created. Salary: GHS 8,000-12,000.</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,.03)', borderRadius: 8, padding: '10px 14px', border: '1px solid rgba(255,255,255,.04)' }}>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,.2)' }}>&ldquo;What if we hire 5 more engineers?&rdquo;</div>
                      <div style={{ fontSize: 12, color: '#2563eb', marginTop: 4 }}>Headcount: 24 &rarr; 29. Annual cost: GHS 300,000. Growth: +21%.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION 6: CUSTOMER JOURNEYS                                  */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="l-section l-section-light">
        <div className="l-section-inner">
          <div className="l-section-tag l-reveal">Journeys</div>
          <div className="l-section-title l-reveal" style={{ transitionDelay: '.05s' }}>6 journeys. Zero manual steps.</div>
          <div className="l-section-desc l-reveal" style={{ transitionDelay: '.1s', marginBottom: 48 }}>
            End-to-end workflows that span every module in the platform.
          </div>
          <div className="l-reveal-scale" style={{ transitionDelay: '.2s', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {journeys.map((j) => (
              <div key={j.num} style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: '24px 24px 20px', transition: 'box-shadow .3s, transform .3s' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#ea580c', letterSpacing: '.06em', marginBottom: 8 }}>{j.num}</div>
                <h4 style={{ fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 6, letterSpacing: '-.01em' }}>{j.title}</h4>
                <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6, marginBottom: 10 }}>{j.desc}</p>
                <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 12, background: '#f5f5f5', color: '#888', fontWeight: 500 }}>{j.modules}</span>
              </div>
            ))}
          </div>
          <div className="l-reveal" style={{ textAlign: 'center', marginTop: 32 }}>
            <a href="/journeys" style={{ fontSize: 14, fontWeight: 600, color: '#ea580c', textDecoration: 'none' }}>See the journeys &rarr;</a>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION 7: SECURITY & COMPLIANCE                              */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="l-section l-section-alt" id="security">
        <div className="l-section-inner">
          <div className="l-section-tag l-reveal">Security</div>
          <div className="l-section-title l-reveal" style={{ transitionDelay: '.05s' }}>Enterprise security. Not an afterthought.</div>
          <div className="l-section-desc l-reveal" style={{ transitionDelay: '.1s', marginBottom: 40 }}>
            Security and compliance are not features. They are the architecture.
          </div>
          <div className="l-sec-grid l-stagger-children l-reveal">
            <div className="l-sec-item"><h4>AES-256-GCM Encryption</h4><p>Per-tenant encryption keys with hardware-backed key management.</p></div>
            <div className="l-sec-item"><h4>SAML 2.0 + OIDC SSO</h4><p>Google, Azure AD, Okta. One-click login for your entire organization.</p></div>
            <div className="l-sec-item"><h4>SCIM 2.0 Provisioning</h4><p>Automated user lifecycle. Create, update, deactivate in real time.</p></div>
            <div className="l-sec-item"><h4>MFA with TOTP</h4><p>Authenticator-based MFA. No SMS fallback. Enforced at the org level.</p></div>
            <div className="l-sec-item"><h4>SOC 2 Type II</h4><p>19 security controls. Independent audit. Continuous monitoring.</p></div>
            <div className="l-sec-item"><h4>PostgreSQL RLS</h4><p>Row-level security for multi-tenant isolation. Your data is invisible to other tenants.</p></div>
            <div className="l-sec-item"><h4>GDPR, NDPR, POPIA</h4><p>Global privacy compliance. Right to erasure. Data portability. Consent management.</p></div>
            <div className="l-sec-item"><h4>Tamper-Evident Logging</h4><p>Immutable audit trail. Every action, every field, every export. Regulator-ready.</p></div>
          </div>
          <div className="l-reveal" style={{ textAlign: 'center', marginTop: 32 }}>
            <a href="/security" style={{ fontSize: 14, fontWeight: 600, color: '#ea580c', textDecoration: 'none' }}>Read our security page &rarr;</a>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION 8: GLOBAL PAYROLL                                     */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="l-section l-section-dark">
        <div className="l-section-inner">
          <div className="l-section-tag l-reveal">Payroll</div>
          <div className="l-section-title l-reveal" style={{ color: '#fff', transitionDelay: '.05s' }}>
            Real payroll. Not just tax brackets.
          </div>
          <div className="l-section-desc l-reveal" style={{ transitionDelay: '.1s', marginBottom: 40 }}>
            Statutory compliance in 96+ countries. Payment files in 7 formats.
          </div>

          <div className="l-reveal-scale" style={{ transitionDelay: '.2s', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, maxWidth: 900, margin: '0 auto' }}>
            {[
              { country: 'Ghana', items: 'PAYE + SSNIT + Form generation' },
              { country: 'Nigeria', items: 'PAYE + NHF + Form H1' },
              { country: 'Kenya', items: 'PAYE + NHIF + P9A' },
              { country: 'India', items: 'PF + ESI + PT + TDS + Form 16' },
              { country: 'Brazil', items: 'INSS + FGTS + IRRF + 13th salary + CLT' },
              { country: '96+ more', items: 'Full statutory compliance included' },
            ].map((c) => (
              <div key={c.country} style={{ background: 'rgba(255,255,255,.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,.06)', padding: '16px 20px' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{c.country}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.3)', lineHeight: 1.5 }}>{c.items}</div>
              </div>
            ))}
          </div>

          <div className="l-reveal" style={{ textAlign: 'center', marginTop: 28 }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.2)', marginBottom: 16 }}>
              7 payment file formats: NACHA, SEPA, BACS, NIBSS, GhIPSS, Kenya RTGS, India NEFT
            </p>
            <a href="/payroll" style={{ fontSize: 14, fontWeight: 600, color: '#ea580c', textDecoration: 'none' }}>Explore Payroll &rarr;</a>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION 9: ENTERPRISE TRUST                                   */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="l-section l-section-light" id="enterprise">
        <div className="l-section-inner">
          <div className="l-section-tag l-reveal">Built for Enterprise</div>
          <div className="l-section-title l-reveal" style={{ transitionDelay: '.05s' }}>
            Built for the world&apos;s most complex organizations.
          </div>
          <div className="l-trust-card l-reveal-scale" style={{ transitionDelay: '.15s', background: 'var(--dk)', borderRadius: 16, padding: '40px 36px', color: '#fff' }} ref={trustRef}>
            <div>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,.4)', fontWeight: 300, lineHeight: 1.7, marginBottom: 16 }}>
                Tempo was born from a simple quest to build an AI-native HR, Finance and IT platform that powers companies from as small as start-ups to those operating around the world, across several regulatory frameworks, and over 20 languages. It handles multi-currency compensation, board-level governance reporting, and incentive calculations that satisfy regulators from London to Johannesburg, from Lagos to New York.
              </p>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,.4)', fontWeight: 300, lineHeight: 1.7 }}>
                Whether you&apos;re a multinational running performance reviews across 80 countries, a bank calibrating compensation across regulatory zones, or a scaling company that wants one platform instead of twelve, Tempo was built for you.
              </p>
            </div>
            <div className="l-trust-stats">
              <div className="l-trust-stat"><div className="l-trust-stat-val" data-final="80+">80+</div><div className="l-trust-stat-label">Countries Supported</div></div>
              <div className="l-trust-stat"><div className="l-trust-stat-val" data-final="50+">50+</div><div className="l-trust-stat-label">Integrated Modules</div></div>
              <div className="l-trust-stat"><div className="l-trust-stat-val" data-final="23">23</div><div className="l-trust-stat-label">Languages</div></div>
              <div className="l-trust-stat"><div className="l-trust-stat-val" data-final="100%">100%</div><div className="l-trust-stat-label">Audit Coverage</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION: HOW IT WORKS                                         */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#fafafa', padding: '80px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          <p style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 2, color: '#ea580c', fontWeight: 600, marginBottom: 0 }}>Get Started</p>
          <h2 className="l-reveal" style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, color: '#1a1a2e', marginTop: 8 }}>Live in days, not months.</h2>
          <p className="l-reveal" style={{ color: '#666', fontSize: 18, marginTop: 12, maxWidth: 600, margin: '12px auto 0' }}>No 6-month implementation project. No army of consultants.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 48, marginTop: 64 }}>
            <div className="l-reveal" style={{ transitionDelay: '0s' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#ea580c', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, margin: '0 auto' }}>1</div>
              <h3 style={{ fontSize: 20, fontWeight: 600, color: '#1a1a2e', marginTop: 20 }}>Book a Demo</h3>
              <p style={{ color: '#666', fontSize: 15, marginTop: 8, lineHeight: 1.6 }}>30 minutes. We&apos;ll show you the platform with your specific use case &mdash; payroll, HR, finance, or all three.</p>
            </div>
            <div className="l-reveal" style={{ transitionDelay: '.1s' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#ea580c', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, margin: '0 auto' }}>2</div>
              <h3 style={{ fontSize: 20, fontWeight: 600, color: '#1a1a2e', marginTop: 20 }}>Configure &amp; Import</h3>
              <p style={{ color: '#666', fontSize: 15, marginTop: 8, lineHeight: 1.6 }}>Upload your employees, set up departments, configure payroll. Our onboarding wizard guides every step.</p>
            </div>
            <div className="l-reveal" style={{ transitionDelay: '.2s' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#ea580c', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, margin: '0 auto' }}>3</div>
              <h3 style={{ fontSize: 20, fontWeight: 600, color: '#1a1a2e', marginTop: 20 }}>Go Live</h3>
              <p style={{ color: '#666', fontSize: 15, marginTop: 8, lineHeight: 1.6 }}>Run your first payroll, assign onboarding journeys, and watch the event cascade fire. You&apos;re live.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION 10: CTA (enhanced warm version)                       */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section style={{ background: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)', padding: '100px 0', textAlign: 'center' }} id="cta">
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 24px' }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, color: '#1a1a2e', lineHeight: 1.2 }}>Ready to see what <span style={{ color: '#ea580c' }}>one platform</span> can do?</h2>
          <p style={{ color: '#555', fontSize: 18, marginTop: 16, lineHeight: 1.6 }}>Book a 30-minute demo and we&apos;ll show you exactly how Tempo works for your company &mdash; with your data, your modules, your compliance requirements.</p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 32, flexWrap: 'wrap' }}>
            <a href="/demo-request" style={{ background: '#ea580c', color: 'white', padding: '16px 36px', borderRadius: 10, fontSize: 16, fontWeight: 600, textDecoration: 'none' }}>Request a Demo</a>
            <a href="/signup" style={{ background: '#1a1a2e', color: 'white', padding: '16px 36px', borderRadius: 10, fontSize: 16, fontWeight: 600, textDecoration: 'none' }}>Start Free Trial</a>
          </div>
          <p style={{ color: '#888', fontSize: 13, marginTop: 16 }}>Or email us directly: <a href="mailto:hello@theworktempo.com" style={{ color: '#ea580c', textDecoration: 'none' }}>hello@theworktempo.com</a></p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION 11: FOOTER                                            */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <footer className="l-footer">
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 48px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 32, marginBottom: 40 }}>
            {/* Brand */}
            <div>
              <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-.02em', color: 'rgba(255,255,255,.3)' }}>tempo<span style={{ color: 'rgba(234,88,12,.5)' }}>.</span></span>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,.12)', marginTop: 8, lineHeight: 1.6 }}>
                The unified workforce platform.
              </p>
            </div>
            {/* Products */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.2)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>Products</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <a href="/people" style={{ fontSize: 13, color: 'rgba(255,255,255,.15)', textDecoration: 'none' }}>HR</a>
                <a href="/payroll" style={{ fontSize: 13, color: 'rgba(255,255,255,.15)', textDecoration: 'none' }}>Payroll</a>
                <a href="/finance/invoices" style={{ fontSize: 13, color: 'rgba(255,255,255,.15)', textDecoration: 'none' }}>Finance</a>
                <a href="/it/devices" style={{ fontSize: 13, color: 'rgba(255,255,255,.15)', textDecoration: 'none' }}>IT</a>
                <a href="/analytics" style={{ fontSize: 13, color: 'rgba(255,255,255,.15)', textDecoration: 'none' }}>AI</a>
              </div>
            </div>
            {/* Company */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.2)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>Company</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <a href="#" style={{ fontSize: 13, color: 'rgba(255,255,255,.15)', textDecoration: 'none' }}>About</a>
                <a href="#" style={{ fontSize: 13, color: 'rgba(255,255,255,.15)', textDecoration: 'none' }}>Careers</a>
                <a href="#" style={{ fontSize: 13, color: 'rgba(255,255,255,.15)', textDecoration: 'none' }}>Press</a>
                <a href="/contact" style={{ fontSize: 13, color: 'rgba(255,255,255,.15)', textDecoration: 'none' }}>Contact</a>
              </div>
            </div>
            {/* Resources */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.2)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>Resources</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <a href="/help" style={{ fontSize: 13, color: 'rgba(255,255,255,.15)', textDecoration: 'none' }}>Help Center</a>
                <a href="/developer" style={{ fontSize: 13, color: 'rgba(255,255,255,.15)', textDecoration: 'none' }}>API Docs</a>
                <a href="#" style={{ fontSize: 13, color: 'rgba(255,255,255,.15)', textDecoration: 'none' }}>Status</a>
                <a href="/academy" style={{ fontSize: 13, color: 'rgba(255,255,255,.15)', textDecoration: 'none' }}>Academy</a>
              </div>
            </div>
            {/* Legal */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.2)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>Legal</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <a href="/privacy" style={{ fontSize: 13, color: 'rgba(255,255,255,.15)', textDecoration: 'none' }}>Privacy</a>
                <a href="/terms" style={{ fontSize: 13, color: 'rgba(255,255,255,.15)', textDecoration: 'none' }}>Terms</a>
                <a href="/security" style={{ fontSize: 13, color: 'rgba(255,255,255,.15)', textDecoration: 'none' }}>Security</a>
                <a href="/gdpr" style={{ fontSize: 13, color: 'rgba(255,255,255,.15)', textDecoration: 'none' }}>DPA</a>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,.04)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.1)' }}>&copy; {new Date().getFullYear()} Tempo. All rights reserved.</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.08)', textTransform: 'uppercase', letterSpacing: '.06em' }}>SOC 2 Compliant &middot; GDPR Ready</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
