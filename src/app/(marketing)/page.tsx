'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

/* ─── SVG Logo Component ─── */
function TempoSvgMark({ width = 12, className = '' }: { width?: number; className?: string }) {
  return (
    <svg style={{ width, height: 'auto' }} className={className} viewBox="0 0 80 100" fill="none">
      <line x1="2" y1="3" x2="78" y2="3" stroke="#fb923c" strokeWidth="5" strokeLinecap="round" opacity=".18" />
      <path d="M4,82 C14,78 28,68 42,50 C56,32 68,14 76,6" stroke="#fb923c" strokeWidth="12" strokeLinecap="round" opacity=".5" />
      <path d="M4,96 C14,90 28,76 44,56 C58,38 70,20 78,10" stroke="#ea580c" strokeWidth="12" strokeLinecap="round" />
    </svg>
  )
}

/* ─── Module data for tabs ─── */
const moduleData = [
  {
    key: 'performance',
    label: 'Performance',
    title: 'Performance Management',
    desc: 'From goal cascading to calibration. The complete performance lifecycle in one module, connected to every other.',
    features: [
      'Goal cascading from strategy to individual KPIs',
      'Annual, mid-year, and 360-degree review cycles',
      '9-box calibration with drag-and-drop placement',
      'Continuous feedback and manager check-ins',
      'Bias detection and review quality scoring (AI)',
    ],
  },
  {
    key: 'compensation',
    label: 'Compensation',
    title: 'Compensation Management',
    desc: 'Market benchmarking, salary reviews, and incentive calculations that satisfy regulators from Lagos to London.',
    features: [
      'Market data integration (Mercer, Radford, WTW)',
      'Multi-currency salary band modeling',
      'STIP/LTIP incentive plan configuration',
      'Budget allocation and manager worksheets',
      'Total rewards statements with live data',
    ],
  },
  {
    key: 'learning',
    label: 'Learning',
    title: 'Learning & Development',
    desc: 'AI-powered course recommendations, SCORM/xAPI content, and skill gap analysis — all tied to career paths.',
    features: [
      'AI course builder with auto-generated content',
      'SCORM/xAPI compatibility for external content',
      'Skill gap analysis and learning path recommendations',
      'Virtual classroom with live sessions',
      'Completion certificates and compliance tracking',
    ],
  },
  {
    key: 'engagement',
    label: 'Engagement',
    title: 'Employee Engagement',
    desc: 'Pulse surveys, eNPS tracking, and AI-driven action plans that connect sentiment to outcomes.',
    features: [
      'Customizable pulse surveys and eNPS',
      'Real-time sentiment dashboards',
      'AI-driven action recommendations',
      'Anonymous feedback channels',
      'Engagement-to-performance correlation analysis',
    ],
  },
  {
    key: 'mentoring',
    label: 'Mentoring',
    title: 'Mentoring & Coaching',
    desc: 'AI-powered matching, session tracking, and outcome measurement for formal and informal programs.',
    features: [
      'AI-powered mentor-mentee matching',
      'Session scheduling and goal tracking',
      'Program templates and milestones',
      'Outcome measurement and ROI reporting',
      'Peer coaching and group mentoring support',
    ],
  },
  {
    key: 'analytics',
    label: 'Analytics',
    title: 'Workforce Analytics',
    desc: 'Cross-module queries, predictive insights, and executive dashboards that span every dimension of your workforce.',
    features: [
      'Natural language cross-module queries',
      'Flight risk prediction and attrition modeling',
      'Compensation equity analysis',
      'Headcount planning and scenario modeling',
      'Executive board-ready report generation',
    ],
  },
]

/* ─── Calibration Grid ─── */
const calibrationData = [
  { bg: '#fef3c7', color: '#d97706', val: '2' },
  { bg: '#eff6ff', color: '#2563eb', val: '5' },
  { bg: '#f0fdf4', color: '#16a34a', val: '12' },
  { bg: '#fef3c7', color: '#d97706', val: '8' },
  { bg: '#eff6ff', color: '#2563eb', val: '34' },
  { bg: '#f0fdf4', color: '#16a34a', val: '28' },
  { bg: '#fef2f2', color: '#dc2626', val: '3' },
  { bg: '#fef3c7', color: '#d97706', val: '15' },
  { bg: '#eff6ff', color: '#2563eb', val: '7' },
]

export default function LandingPage() {
  const navRef = useRef<HTMLElement>(null)
  const statGridRef = useRef<HTMLDivElement>(null)
  const tableRef = useRef<HTMLDivElement>(null)
  const cascadeRef = useRef<HTMLDivElement>(null)
  const flowRef = useRef<HTMLDivElement>(null)
  const queryRef = useRef<HTMLDivElement>(null)
  const typedQueryRef = useRef<HTMLDivElement>(null)
  const queryResultsRef = useRef<HTMLDivElement>(null)
  const trustRef = useRef<HTMLDivElement>(null)
  const [activeModule, setActiveModule] = useState(0)
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

  /* ─── Flow demo (Workflow 2) ─── */
  useEffect(() => {
    const el = flowRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const steps = e.target.querySelectorAll('.l-flow-step')
            const arrows = e.target.querySelectorAll('.l-flow-arrow')
            let delay = 0
            steps.forEach((step, i) => {
              setTimeout(() => step.classList.add('animated'), delay)
              delay += 400
              if (arrows[i]) {
                setTimeout(() => arrows[i].classList.add('animated'), delay)
                delay += 200
              }
            })
            obs.unobserve(e.target)
          }
        })
      },
      { threshold: 0.3 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  /* ─── Query typing demo (Workflow 3) ─── */
  useEffect(() => {
    const el = queryRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const queryText = 'Rated 4+ AND comp ratio < 0.9 AND no leadership training'
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

  const mod = moduleData[activeModule]

  return (
    <div className="landing">
      {/* ═══ NAV ═══ */}
      <nav className="l-nav" ref={navRef}>
        <div className="l-nav-left">
          <a href="#" className="l-nav-logo" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
            <TempoSvgMark width={12} />
            <span style={{ width: 3, display: 'inline-block' }} />
            <span style={{ fontSize: 20, fontWeight: 500, letterSpacing: '-0.035em', color: 'var(--lt1)' }}>tempo</span>
          </a>
          <div className="l-nav-links">
            <a href="#platform" onClick={(e) => handleAnchorClick(e, 'platform')}>Platform</a>
            <a href="#modules" onClick={(e) => handleAnchorClick(e, 'modules')}>Modules</a>
            <a href="#enterprise" onClick={(e) => handleAnchorClick(e, 'enterprise')}>Enterprise</a>
            <a href="#security" onClick={(e) => handleAnchorClick(e, 'security')}>Security</a>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/login" style={{ fontSize: 14, fontWeight: 500, color: 'var(--lt2)', textDecoration: 'none', transition: '.15s' }}>Sign In</a>
          <a href="#demo" className="l-nav-cta" onClick={(e) => handleAnchorClick(e, 'demo')}>Request a Demo</a>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="l-hero">
        <div className="l-hero-glow" />
        <div className="l-hero-badge l-fade-up">The Unified Workforce Platform</div>
        <h1 className="l-fade-up l-d1">
          Set the standard.<br />Rise to <em>meet it.</em>
        </h1>
        <p className="l-hero-sub l-fade-up l-d2">
          Performance, compensation, and talent in one platform. One employee record. Six integrated modules. Built for the complexity of global enterprise.
        </p>
        <div className="l-hero-ctas l-fade-up l-d3">
          <a href="#demo" className="l-btn-primary" onClick={(e) => handleAnchorClick(e, 'demo')}>Request a Demo</a>
          <a href="#platform" className="l-btn-secondary" onClick={(e) => handleAnchorClick(e, 'platform')}>See how it works &rarr;</a>
        </div>

        {/* Product Screenshot */}
        <div className="l-hero-product l-fade-up l-d4">
          <div className="l-hero-product-frame">
            <div className="l-topbar">
              <div className="l-topbar-dot" /><div className="l-topbar-dot" /><div className="l-topbar-dot" />
              <span style={{ flex: 1 }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,.12)' }}>tempo &mdash; Dashboard</span>
              <span style={{ flex: 1 }} />
            </div>
            <div className="l-product-body">
              <div className="l-sidebar">
                <div className="l-sidebar-logo">
                  <TempoSvgMark width={10} />
                  <span style={{ width: 2, display: 'inline-block' }} />
                  <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: '-.035em', color: '#fff' }}>tempo</span>
                </div>
                <div className="l-sidebar-label">Modules</div>
                {([
                  { key: 'dashboard', label: 'Dashboard', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /></svg> },
                  { key: 'performance', label: 'Performance', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3,20 C5,14 9,10 11,8" /><path d="M6,21 C8,15 12,11 14,9 C16,7 18,5 21,4" /></svg> },
                  { key: 'compensation', label: 'Compensation', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12,2 L12,8" /><path d="M12,10 L12,14" /><rect x="4" y="14" width="16" height="8" rx="2" /></svg> },
                  { key: 'learning', label: 'Learning', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2,7 L12,2 L22,7 L12,12 Z" /></svg> },
                  { key: 'engagement', label: 'Engagement', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12,4 L12,12" /><circle cx="12" cy="18" r="2.5" /></svg> },
                  { key: 'mentoring', label: 'Mentoring', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="8" cy="6" r="3" /><circle cx="17" cy="8" r="2.5" /></svg> },
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
                    <div>
                      <div className="l-canvas-title">Performance Reviews</div>
                      <div className="l-canvas-subtitle">Q4 2026 Cycle / EMEA Region</div>
                    </div>
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
                    <div>
                      <div className="l-canvas-title">Compensation Planning</div>
                      <div className="l-canvas-subtitle">2026 Annual Review / All Bands</div>
                    </div>
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
                    <div>
                      <div className="l-canvas-title">Learning Paths</div>
                      <div className="l-canvas-subtitle">Active Programs / Q4 2026</div>
                    </div>
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
                    <div>
                      <div className="l-canvas-title">Employee Engagement</div>
                      <div className="l-canvas-subtitle">Pulse Survey / March 2026</div>
                    </div>
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

                {heroModule === 'mentoring' && (<>
                  <div className="l-canvas-header">
                    <div>
                      <div className="l-canvas-title">Mentoring Programs</div>
                      <div className="l-canvas-subtitle">Active Matches / All Programs</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <span style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, background: 'var(--lbg)', border: '1px solid var(--bd)', color: 'var(--lt3)', fontWeight: 500 }}>Programs</span>
                      <span style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, background: 'var(--o)', color: '#fff', fontWeight: 500 }}>+ Match</span>
                    </div>
                  </div>
                  <div className="l-stat-grid animated">
                    <div className="l-stat-card"><div className="l-stat-label">Active Pairs</div><div className="l-stat-val orange">84</div><div className="l-stat-delta">+12 this Q</div></div>
                    <div className="l-stat-card"><div className="l-stat-label">Sessions / Month</div><div className="l-stat-val">312</div><div className="l-stat-delta">3.7 per pair</div></div>
                    <div className="l-stat-card"><div className="l-stat-label">Match Score</div><div className="l-stat-val">92%</div><div className="l-stat-delta">AI-powered</div></div>
                    <div className="l-stat-card"><div className="l-stat-label">Goal Progress</div><div className="l-stat-val">68%</div><div className="l-stat-delta">+14% vs Q3</div></div>
                  </div>
                  <div className="l-demo-table animated">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr><th>Mentee</th><th>Mentor</th><th>Program</th><th>Sessions</th><th>Progress</th><th>Status</th></tr></thead>
                      <tbody>
                        <tr><td>Binta Sow</td><td>Amara Kone</td><td>Leadership</td><td>8/12</td><td>67%</td><td><span className="l-tag l-tag-green">Active</span></td></tr>
                        <tr><td>Kofi Asante</td><td>Sarah Chen</td><td>Cross-functional</td><td>5/10</td><td>50%</td><td><span className="l-tag l-tag-green">Active</span></td></tr>
                        <tr><td>David Osei</td><td>Marcus Weber</td><td>Technical</td><td>3/8</td><td>38%</td><td><span className="l-tag l-tag-amber">Behind</span></td></tr>
                        <tr><td>Priya Sharma</td><td>Fatou Diallo</td><td>Leadership</td><td>12/12</td><td>100%</td><td><span className="l-tag l-tag-green">Complete</span></td></tr>
                      </tbody>
                    </table>
                  </div>
                </>)}

                {heroModule === 'analytics' && (<>
                  <div className="l-canvas-header">
                    <div>
                      <div className="l-canvas-title">Workforce Analytics</div>
                      <div className="l-canvas-subtitle">Cross-Module Insights / 2026</div>
                    </div>
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

        {/* Integration Logo Bar */}
        <div style={{ maxWidth: 800, margin: '0 auto', paddingTop: 48, position: 'relative' }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.12em', color: 'rgba(255,255,255,.1)', textAlign: 'center', marginBottom: 16 }}>
            Works with your existing stack
          </div>
          <div className="l-logo-bar">
            <span>SAP</span><span>Workday</span><span>Oracle</span><span>Active Directory</span><span>Okta</span><span>Mercer</span>
          </div>
        </div>
      </section>

      {/* ═══ PRODUCT DEMOS ═══ */}
      <section className="l-section l-section-light" id="platform">
        <div className="l-section-inner">
          <div className="l-section-tag l-reveal">How It Works</div>
          <div className="l-section-title l-reveal" style={{ transitionDelay: '.05s' }}>See Tempo in action.</div>
          <div className="l-section-desc l-reveal" style={{ transitionDelay: '.1s' }}>
            Not feature lists. Real workflows. Here&apos;s what happens when everything shares one data layer.
          </div>

          {/* Workflow 1: Cascade */}
          <div className="l-demo-seq">
            <div className="l-demo-text l-reveal-left">
              <div className="l-section-tag">Workflow 1</div>
              <h3>One change. Everywhere.</h3>
              <p>Update an employee&apos;s role once. Watch it cascade through their performance goals, comp band, learning path, and access permissions simultaneously. No sync. No delay. No spreadsheet reconciliation. This is what &ldquo;unified&rdquo; actually means.</p>
            </div>
            <div className="l-demo-visual l-reveal-right" ref={cascadeRef}>
              <div style={{ padding: 28, width: '100%' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="l-cascade-item" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,var(--ol),var(--o))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Role changed</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)' }}>Analyst &rarr; Senior Analyst</div>
                    </div>
                  </div>
                  <div style={{ marginLeft: 18, borderLeft: '2px solid rgba(255,255,255,.06)', paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 8 }}>
                    {[
                      { text: 'Goals updated to Senior band', time: '0.2s' },
                      { text: 'Comp band adjusted: P50 → $48,200', time: '0.2s' },
                      { text: 'Learning path: Leadership Essentials', time: '0.3s' },
                      { text: 'Permissions: Budget view unlocked', time: '0.3s' },
                    ].map((item) => (
                      <div key={item.text} className="l-cascade-item" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="l-flow-dot" style={{ background: 'var(--ol)' }} />
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,.4)' }}>{item.text}</span>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,.12)', marginLeft: 'auto' }}>{item.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Workflow 2: Review to Raise */}
          <div className="l-demo-seq reverse">
            <div className="l-demo-text l-reveal-right">
              <div className="l-section-tag">Workflow 2</div>
              <h3>From review to raise. One flow.</h3>
              <p>A completed performance review automatically triggers the compensation workflow. The manager sees the budget, the comp ratio, and the market benchmark. They propose. HR approves. One flow, no handoffs, full audit trail.</p>
            </div>
            <div className="l-demo-visual l-reveal-left" ref={flowRef}>
              <div style={{ padding: 28, width: '100%' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div className="l-flow-step" style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,.04)', borderRadius: 10, padding: '12px 14px' }}>
                    <div className="l-flow-dot" style={{ background: '#16a34a' }} />
                    <div><div style={{ fontSize: 12, fontWeight: 500, color: '#fff' }}>Review Complete</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,.2)' }}>Rating: 4.2 / Exceeds expectations</div></div>
                  </div>
                  <div className="l-flow-arrow" style={{ textAlign: 'center', fontSize: 16, color: 'rgba(255,255,255,.08)' }}>&darr;</div>
                  <div className="l-flow-step" style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(234,88,12,.08)', border: '1px solid rgba(234,88,12,.15)', borderRadius: 10, padding: '12px 14px' }}>
                    <div className="l-flow-dot pulse" style={{ background: 'var(--ol)' }} />
                    <div><div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ol)' }}>Comp Review Triggered</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,.2)' }}>Budget: $4,200 / CR: 0.94 / Mkt P50: $48,200</div></div>
                  </div>
                  <div className="l-flow-arrow" style={{ textAlign: 'center', fontSize: 16, color: 'rgba(255,255,255,.08)' }}>&darr;</div>
                  <div className="l-flow-step" style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,.04)', borderRadius: 10, padding: '12px 14px' }}>
                    <div className="l-flow-dot" style={{ background: '#2563eb' }} />
                    <div><div style={{ fontSize: 12, fontWeight: 500, color: '#fff' }}>Manager Proposes +8%</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,.2)' }}>New CR: 1.01 / Within band / Awaiting HR</div></div>
                  </div>
                  <div className="l-flow-arrow" style={{ textAlign: 'center', fontSize: 16, color: 'rgba(255,255,255,.08)' }}>&darr;</div>
                  <div className="l-flow-step" style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(22,163,74,.06)', border: '1px solid rgba(22,163,74,.15)', borderRadius: 10, padding: '12px 14px' }}>
                    <div className="l-flow-dot" style={{ background: '#16a34a' }} />
                    <div><div style={{ fontSize: 12, fontWeight: 500, color: '#16a34a' }}>Approved &amp; Executed</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,.2)' }}>Effective: Jan 1 / Audit ref: CR-2026-4481</div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Workflow 3: Query */}
          <div className="l-demo-seq">
            <div className="l-demo-text l-reveal-left">
              <div className="l-section-tag">Workflow 3</div>
              <h3>Ask anything about your workforce.</h3>
              <p>Because every module shares one data layer, you can query across boundaries. &ldquo;Show me employees rated 4+ whose comp ratio is below 0.9 who haven&apos;t completed leadership training.&rdquo; One search. One answer. Impossible with separate tools.</p>
            </div>
            <div className="l-demo-visual l-reveal-right" ref={queryRef}>
              <div style={{ padding: 28, width: '100%' }}>
                <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, border: '1px solid rgba(255,255,255,.06)' }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,.15)', marginBottom: 4 }}>Query</div>
                  <div ref={typedQueryRef} style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', fontWeight: 300, minHeight: 20 }}>
                    <span className="l-type-cursor" />
                  </div>
                </div>
                <div ref={queryResultsRef} style={{ opacity: 0, transition: 'opacity .5s ease' }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,.12)', marginBottom: 8 }}>23 employees found across 3 modules</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 8, fontSize: 10, color: 'rgba(255,255,255,.12)', textTransform: 'uppercase', letterSpacing: '.05em', padding: '4px 0' }}>
                      <div>Name</div><div>Rating</div><div>CR</div><div>Training</div>
                    </div>
                    {[
                      { name: 'Priya Sharma', rating: '4.3', cr: '0.87', training: 'Not started' },
                      { name: 'Emma Lindqvist', rating: '4.1', cr: '0.82', training: 'Not enrolled' },
                      { name: 'Kwame Asante', rating: '4.0', cr: '0.88', training: 'Expired' },
                    ].map((row) => (
                      <div key={row.name} className="l-query-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 8, fontSize: 12, color: 'rgba(255,255,255,.4)', padding: '6px 0', borderTop: '1px solid rgba(255,255,255,.04)' }}>
                        <div style={{ color: 'rgba(255,255,255,.6)' }}>{row.name}</div>
                        <div>{row.rating}</div>
                        <div style={{ color: 'var(--ol)' }}>{row.cr}</div>
                        <div style={{ color: '#ef4444' }}>{row.training}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PRINCIPLES ═══ */}
      <section className="l-section l-section-dark" id="principles">
        <div className="l-section-inner">
          <div className="l-section-tag l-reveal">Why Tempo</div>
          <div className="l-section-title l-reveal" style={{ color: '#fff', transitionDelay: '.05s' }}>Three principles. Zero compromise.</div>
          <div className="l-section-desc l-reveal" style={{ marginBottom: 40, transitionDelay: '.1s' }}>
            Every platform claims to be &ldquo;unified&rdquo; and &ldquo;enterprise-grade.&rdquo; Here&apos;s what we actually mean.
          </div>
          <div className="l-principle-grid l-reveal-scale" style={{ transitionDelay: '.2s' }}>
            <div className="l-principle">
              <div className="l-principle-num">01</div>
              <h3>Unified, not bundled.</h3>
              <p>Most &ldquo;all-in-one&rdquo; platforms bundle separate tools under one login. Different data models, different permissions, different UX. Tempo is architecturally unified. One employee graph. One permissions engine. One data layer. When something changes, it changes everywhere, instantly.</p>
            </div>
            <div className="l-principle">
              <div className="l-principle-num">02</div>
              <h3>Governed by design.</h3>
              <p>Every action in Tempo has an audit trail. Role-based access isn&apos;t optional, it&apos;s structural. Compensation data is invisible without explicit permission. Workflows enforce approval chains. Built for organizations where compliance isn&apos;t a feature, it&apos;s the foundation.</p>
            </div>
            <div className="l-principle">
              <div className="l-principle-num">03</div>
              <h3>Beautiful without compromise.</h3>
              <p>Enterprise software shouldn&apos;t make people dread opening it. Tempo is designed so a first-time user can complete their task without training. Dark chrome for authority. Light canvas for clarity. Warm orange for humanity. Every pixel is intentional.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ MODULES ═══ */}
      <section className="l-section l-section-alt" id="modules">
        <div className="l-section-inner">
          <div className="l-section-tag l-reveal">Platform</div>
          <div className="l-section-title l-reveal" style={{ transitionDelay: '.05s' }}>Six modules. One platform.</div>
          <div className="l-section-desc l-reveal" style={{ transitionDelay: '.1s' }}>
            Every module shares one employee graph, one permissions engine, one data layer.
          </div>
          <div className="l-mod-tabs l-reveal" style={{ transitionDelay: '.15s' }}>
            {moduleData.map((m, i) => (
              <div
                key={m.key}
                className={`l-mod-tab ${i === activeModule ? 'active' : ''}`}
                onClick={() => setActiveModule(i)}
              >
                {m.label}
              </div>
            ))}
          </div>
          <div className="l-mod-content">
            <div className="l-mod-info">
              <h3>{mod.title}</h3>
              <p>{mod.desc}</p>
              <ul className="l-mod-features">
                {mod.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
            <div className="l-demo-visual-light">
              <div style={{ padding: 24, width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Calibration / EMEA</div>
                  <div style={{ fontSize: 11, color: 'var(--lt3)' }}>Q4 2026</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gridTemplateRows: 'repeat(3,1fr)', gap: 4, aspectRatio: '1' }}>
                  {calibrationData.map((c, i) => (
                    <div key={i} style={{ background: c.bg, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: c.color, fontWeight: 600 }}>
                      {c.val}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 9, color: 'var(--lt4)' }}>
                  <span>Low potential &rarr;</span><span>High potential</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TRUST ═══ */}
      <section className="l-section l-section-dark" id="enterprise">
        <div className="l-section-inner">
          <div className="l-section-tag l-reveal">Built for Enterprise</div>
          <div className="l-section-title l-reveal" style={{ color: '#fff', marginBottom: 28, transitionDelay: '.05s' }}>
            Built for the world&apos;s most<br />complex organizations.
          </div>
          <div className="l-trust-card l-reveal-scale" style={{ transitionDelay: '.15s' }} ref={trustRef}>
            <div>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,.4)', fontWeight: 300, lineHeight: 1.7, marginBottom: 16 }}>
                Tempo was born inside a pan-African bank operating across 33 countries, 4 regulatory frameworks, and 3 languages. It handles multi-currency compensation, board-level governance reporting, and incentive calculations that satisfy regulators from Lagos to London to Sao Paulo.
              </p>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,.4)', fontWeight: 300, lineHeight: 1.7 }}>
                That complexity is the product. Whether you&apos;re a multinational running performance reviews across 80 countries, a bank calibrating compensation across regulatory zones, or a scaling company that wants one platform instead of twelve, Tempo was built for you.
              </p>
            </div>
            <div className="l-trust-stats">
              <div className="l-trust-stat"><div className="l-trust-stat-val" data-final="80+">80+</div><div className="l-trust-stat-label">Countries Supported</div></div>
              <div className="l-trust-stat"><div className="l-trust-stat-val" data-final="6">6</div><div className="l-trust-stat-label">Integrated Modules</div></div>
              <div className="l-trust-stat"><div className="l-trust-stat-val" data-final="23">23</div><div className="l-trust-stat-label">Languages</div></div>
              <div className="l-trust-stat"><div className="l-trust-stat-val" data-final="100%">100%</div><div className="l-trust-stat-label">Audit Coverage</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SECURITY ═══ */}
      <section className="l-section l-section-alt" id="security">
        <div className="l-section-inner">
          <div className="l-section-tag l-reveal">Security</div>
          <div className="l-section-title l-reveal" style={{ transitionDelay: '.05s' }}>Enterprise-grade by default.</div>
          <div className="l-section-desc l-reveal" style={{ transitionDelay: '.1s' }}>
            Security and compliance are not features in Tempo. They are the architecture.
          </div>
          <div className="l-sec-grid l-stagger-children l-reveal">
            <div className="l-sec-item"><h4>Bank-Grade Encryption</h4><p>AES-256 at rest, TLS 1.3 in transit. Your data is protected at every layer.</p></div>
            <div className="l-sec-item"><h4>Role-Based Access</h4><p>Dynamic permissions based on role, region, and attribute. Enforced across every screen, every export, every API call.</p></div>
            <div className="l-sec-item"><h4>Full Audit Trail</h4><p>Every action is logged with user, timestamp, before/after state, and IP. Immutable. Regulator-ready.</p></div>
            <div className="l-sec-item"><h4>SSO &amp; SCIM</h4><p>SAML 2.0, Active Directory, Okta, Azure AD. Automatic provisioning and deprovisioning.</p></div>
            <div className="l-sec-item"><h4>Data Residency</h4><p>Choose where your data lives. Regional deployments for regulatory compliance.</p></div>
            <div className="l-sec-item"><h4>SOC 2 Type II</h4><p>Annual third-party audits. Continuous monitoring. Penetration testing.</p></div>
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="l-cta-section" id="demo">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <TempoSvgMark width={40} className="mx-auto" />
          <div style={{ marginTop: 20, fontSize: 'clamp(28px,4vw,48px)', fontWeight: 300, color: '#fff', letterSpacing: '-.025em', marginBottom: 12 }}>
            Ready to see Tempo?
          </div>
          <div style={{ fontSize: 16, color: 'rgba(255,255,255,.3)', fontWeight: 300, marginBottom: 32, maxWidth: 400, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
            Request a personalized demo for your organization. We&apos;ll walk you through the platform with your context.
          </div>
          <a href="mailto:hello@tempo.work" className="l-btn-primary" style={{ fontSize: 16, padding: '14px 36px' }}>Request a Demo</a>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.15)', marginTop: 14 }}>Or email hello@tempo.work</div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="l-footer">
        <div className="l-footer-inner">
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 0 }}>
            <TempoSvgMark width={10} />
            <span style={{ width: 2, display: 'inline-block' }} />
            <span style={{ fontSize: 16, fontWeight: 500, letterSpacing: '-.035em', color: 'rgba(255,255,255,.3)' }}>tempo</span>
          </div>
          <div className="l-footer-links">
            <a href="#platform" onClick={(e) => handleAnchorClick(e, 'platform')}>Platform</a>
            <a href="#modules" onClick={(e) => handleAnchorClick(e, 'modules')}>Modules</a>
            <a href="#security" onClick={(e) => handleAnchorClick(e, 'security')}>Security</a>
            <a href="#">About</a>
            <a href="#">Careers</a>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.1)' }}>&copy; {new Date().getFullYear()} Tempo</div>
        </div>
      </footer>
    </div>
  )
}
