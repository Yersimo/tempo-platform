'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

/* ========== MEGA MENU ========== */
export function MegaMenu() {
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const toggleMenu = useCallback((id: string) => {
    setOpenMenu(prev => prev === id ? null : id)
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (!target.closest('nav') && !target.closest('.mega-drop')) {
        setOpenMenu(null)
      }
    }
    function handleKeydown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpenMenu(null)
    }
    document.addEventListener('click', handleClick)
    document.addEventListener('keydown', handleKeydown)
    return () => {
      document.removeEventListener('click', handleClick)
      document.removeEventListener('keydown', handleKeydown)
    }
  }, [])

  return { openMenu, toggleMenu }
}

/* ========== NAV WRAPPER (client) ========== */
const NavChevron = () => (
  <svg className="nav-chevron" viewBox="0 0 12 12" fill="none">
    <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const MegaChevron = () => (
  <svg className="mega-chevron" viewBox="0 0 18 18" fill="none">
    <path d="M5 9h8M9.5 5.5L13 9l-3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const ArrowIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M2.5 6.5h8M7 3L10.5 6.5 7 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export function LandingNav() {
  const { openMenu, toggleMenu } = MegaMenu()

  const navItems = ['products', 'industries', 'customers', 'learn', 'resources', 'company']

  return (
    <>
      <nav>
        <a href="/" className="logo">tempo<span>.</span></a>
        <ul className="nav-links">
          {navItems.map(id => (
            <li key={id} id={`nav-${id}`} className={openMenu === id ? 'open' : ''}>
              <button
                onClick={() => toggleMenu(id)}
                aria-expanded={openMenu === id}
              >
                {id.charAt(0).toUpperCase() + id.slice(1)}
                <NavChevron />
              </button>
            </li>
          ))}
        </ul>
        <div className="nav-ctas">
          <a href="/login" className="btn btn-ghost">Sign In</a>
          <a href="/contact" className="btn btn-dark">
            Contact Sales
            <ArrowIcon />
          </a>
        </div>
      </nav>

      {/* PRODUCTS MEGA MENU */}
      <div className={`mega-drop${openMenu === 'products' ? ' open' : ''}`} id="drop-products">
        <div className="mega-inner">
          <div className="mega-main">
            {['AI', 'HR', 'Finance', 'Operations', 'IT', 'Platform'].map(name => (
              <a key={name} href="#" className="mega-item">
                <span className="mega-item-name">{name}</span>
                <MegaChevron />
              </a>
            ))}
          </div>
          <div className="mega-secondary">
            <div className="mega-sec-title">More from Tempo</div>
            <a href="#" className="mega-sec-link">Tempo Build</a>
            <a href="/why-tempo" className="mega-sec-link">Why Tempo</a>
            <a href="#" className="mega-sec-link">Solutions for Mid-Size Business</a>
            <a href="#" className="mega-sec-link">Tempo ERP</a>
            <div className="mega-sec-title" style={{ marginTop: 20 }}>Ecosystem</div>
            <a href="#" className="mega-sec-link">Partners</a>
            <a href="#" className="mega-sec-link">Marketplace <span className="mega-ext">{'\u2197'}</span></a>
          </div>
        </div>
      </div>

      {/* INDUSTRIES MEGA MENU */}
      <div className={`mega-drop mega-drop-single${openMenu === 'industries' ? ' open' : ''}`} id="drop-industries">
        <div className="mega-inner-single">
          {[
            'Banking & Capital Markets', 'Financial Services', 'Hospitality',
            'Insurance', 'Investment Management', 'Manufacturing',
            'Professional & Business Services', 'Public Services',
            'Retail', 'Technology', 'Technology Scaleups',
          ].map(name => (
            <a key={name} href="#" className="mega-item mega-item-lg">{name}</a>
          ))}
          <a href="#" className="mega-item mega-item-lg" style={{ color: 'var(--orange)' }}>All Industries</a>
        </div>
      </div>

      {/* CUSTOMERS MEGA MENU */}
      <div className={`mega-drop${openMenu === 'customers' ? ' open' : ''}`} id="drop-customers">
        <div className="mega-inner mega-inner-customers">
          <div className="mega-main mega-main-split">
            <a href="/customer-journeys" className="mega-item"><span className="mega-item-name">Customer Stories</span></a>
            <a href="#" className="mega-item"><span className="mega-item-name">Services</span><MegaChevron /></a>
            <a href="#" className="mega-item mega-item-active"><span className="mega-item-name">Support</span><MegaChevron /></a>
          </div>
          <div className="mega-secondary mega-secondary-divider">
            <a href="#" className="mega-sec-link">Overview</a>
            <a href="#" className="mega-sec-link">Community</a>
            <a href="#" className="mega-sec-link">Login Help</a>
          </div>
        </div>
      </div>

      {/* LEARN MEGA MENU */}
      <div className={`mega-drop${openMenu === 'learn' ? ' open' : ''}`} id="drop-learn">
        <div className="mega-inner">
          <div className="mega-main">
            {['Blog & Insights', 'Webinars & Events', 'Tempo Academy', 'Certifications', 'Documentation'].map(name => (
              <a key={name} href="#" className="mega-item"><span className="mega-item-name">{name}</span><MegaChevron /></a>
            ))}
          </div>
          <div className="mega-secondary">
            <div className="mega-sec-title">Popular</div>
            <a href="#" className="mega-sec-link">Getting Started Guide</a>
            <a href="#" className="mega-sec-link">API Reference <span className="mega-ext">{'\u2197'}</span></a>
            <a href="#" className="mega-sec-link">Release Notes</a>
            <a href="#" className="mega-sec-link">Status Page <span className="mega-ext">{'\u2197'}</span></a>
          </div>
        </div>
      </div>

      {/* RESOURCES MEGA MENU */}
      <div className={`mega-drop${openMenu === 'resources' ? ' open' : ''}`} id="drop-resources">
        <div className="mega-inner">
          <div className="mega-main">
            {['Help Center', 'Reports & Research', 'Templates', 'HR Benchmarking Tool'].map(name => (
              <a key={name} href="#" className="mega-item"><span className="mega-item-name">{name}</span><MegaChevron /></a>
            ))}
          </div>
          <div className="mega-secondary">
            <div className="mega-sec-title">Useful links</div>
            <a href="/security" className="mega-sec-link">Security & Compliance</a>
            <a href="/gdpr" className="mega-sec-link">GDPR Centre</a>
            <a href="#" className="mega-sec-link">Data Processing Agreement</a>
            <a href="#" className="mega-sec-link">Trust Portal <span className="mega-ext">{'\u2197'}</span></a>
          </div>
        </div>
      </div>

      {/* COMPANY MEGA MENU */}
      <div className={`mega-drop${openMenu === 'company' ? ' open' : ''}`} id="drop-company">
        <div className="mega-inner mega-inner-company">
          <div className="mega-main">
            <a href="#" className="mega-item"><span className="mega-item-name">About Tempo</span><MegaChevron /></a>
            <a href="#" className="mega-item"><span className="mega-item-name">Careers</span><MegaChevron /></a>
            <a href="#" className="mega-item"><span className="mega-item-name">Corporate Responsibility</span><MegaChevron /></a>
            <a href="#" className="mega-item"><span className="mega-item-name">Trust</span></a>
            <a href="#" className="mega-item"><span className="mega-item-name">Investor Relations</span><span className="mega-ext" style={{ fontSize: 15, marginLeft: 6 }}>{'\u2197'}</span></a>
            <a href="#" className="mega-item"><span className="mega-item-name">Newsroom</span><span className="mega-ext" style={{ fontSize: 15, marginLeft: 6 }}>{'\u2197'}</span></a>
          </div>
          <div className="mega-company-panel">
            <div className="mega-company-img">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&q=80&auto=format&fit=crop"
                alt="Tempo team"
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12, opacity: 0.85 }}
              />
            </div>
            <div className="mega-company-tagline">&ldquo;Building the platform that makes work better for everyone.&rdquo;</div>
            <a href="#" className="mega-company-link">Meet the team &rarr;</a>
          </div>
        </div>
      </div>
    </>
  )
}


/* ========== HERO CAROUSEL ========== */
export function HeroCarousel() {
  const SLIDE_DURATION = 4500
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const slideCount = 5
  const dotsRef = useRef<(HTMLDivElement | null)[]>([])

  const goTo = useCallback((idx: number) => {
    const next = idx % slideCount
    setCurrent(next)
    // Restart fill animation on the dot
    const dot = dotsRef.current[next]
    if (dot) {
      const fill = dot.querySelector('.cdot-fill') as HTMLElement
      if (fill) {
        fill.style.animation = 'none'
        // force reflow
        void fill.offsetHeight
        fill.style.animation = ''
      }
    }
  }, [slideCount])

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCurrent(prev => {
        const next = (prev + 1) % slideCount
        // restart fill animation
        const dot = dotsRef.current[next]
        if (dot) {
          const fill = dot.querySelector('.cdot-fill') as HTMLElement
          if (fill) {
            fill.style.animation = 'none'
            void fill.offsetHeight
            fill.style.animation = ''
          }
        }
        return next
      })
    }, SLIDE_DURATION)
  }, [slideCount])

  useEffect(() => {
    if (!paused) startTimer()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [paused, startTimer])

  const togglePause = useCallback(() => {
    setPaused(prev => {
      if (!prev) {
        // pausing
        if (timerRef.current) clearInterval(timerRef.current)
        // Freeze fill animation
        const dot = dotsRef.current[current]
        if (dot) {
          const fill = dot.querySelector('.cdot-fill') as HTMLElement
          if (fill) {
            const computed = getComputedStyle(fill).width
            fill.style.animation = 'none'
            fill.style.width = computed
          }
        }
      } else {
        // unpausing
        goTo(current)
        startTimer()
      }
      return !prev
    })
  }, [current, goTo, startTimer])

  const handleDotClick = useCallback((idx: number) => {
    goTo(idx)
    if (!paused) {
      if (timerRef.current) clearInterval(timerRef.current)
      startTimer()
    }
  }, [goTo, paused, startTimer])

  return (
    <div className="dash-float" id="heroCarousel">
      <div className="carousel-track" id="carouselTrack">

        {/* SLIDE 1: Workforce Dashboard */}
        <div className={`carousel-slide${current === 0 ? ' active' : ''}`}>
          <div className="dash-card">
            <div className="dash-bar">
              <div className="dots"><div className="dot r" /><div className="dot y" /><div className="dot g" /></div>
              <div className="addr">app.theworktempo.com/dashboard</div>
            </div>
            <div className="dash-body">
              <div className="dash-hd"><span className="dash-ttl">Workforce Overview</span><span className="dash-qt">Q4 2026 &middot; All Regions</span></div>
              <div className="dash-grid">
                <div className="dg"><div className="dg-v">78%</div><div className="dg-l">Reviews done</div><div className="dg-d">{'\u2191'} +12% vs Q3</div></div>
                <div className="dg"><div className="dg-v">48.3k</div><div className="dg-l">Employees</div><div className="dg-d">{'\u2191'} +2.1% YoY</div></div>
                <div className="dg"><div className="dg-v">1.02</div><div className="dg-l">Comp ratio</div><div className="dg-d" style={{ color: 'var(--muted)' }}>At market</div></div>
                <div className="dg"><div className="dg-v">+42</div><div className="dg-l">eNPS score</div><div className="dg-d">{'\u2191'} +8 vs H1</div></div>
              </div>
              <table className="dash-tbl">
                <thead><tr><th>Employee</th><th>Region</th><th>Rating</th><th>Status</th></tr></thead>
                <tbody>
                  <tr><td>Naledi Nkosi</td><td>Singapore</td><td>4.2</td><td><span className="pill p-g">Complete</span></td></tr>
                  <tr><td>Pieter van den Berg</td><td>Germany</td><td>3.8</td><td><span className="pill p-y">In Review</span></td></tr>
                  <tr><td>Wanjiku Kamau</td><td>Senegal</td><td>4.5</td><td><span className="pill p-g">Complete</span></td></tr>
                  <tr><td>Lucas Ferreira</td><td>Mexico</td><td>&mdash;</td><td><span className="pill p-o">Pending</span></td></tr>
                </tbody>
              </table>
              <div className="chips">
                <div className="chip"><div className="chip-t">{'\u2713'} Payroll Processed</div><div className="chip-s">12 employees &middot; GH{'\u20B5'}29,486</div></div>
                <div className="chip"><div className="chip-t">{'\u2295'} New Hire Onboarded</div><div className="chip-s">Priya S. &middot; 9 systems synced</div></div>
                <div className="chip"><div className="chip-t">{'\u25CE'} Certificate Issued</div><div className="chip-s">Jan v.d. Berg &middot; AML</div></div>
              </div>
            </div>
          </div>
        </div>

        {/* SLIDE 2: AI Photo card */}
        <div className={`carousel-slide${current === 1 ? ' active' : ''}`}>
          <div className="slide-photo-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=900&q=85&auto=format&fit=crop" alt="Tempo AI" className="slide-photo" />
            <div className="slide-caption">
              <div className="slide-caption-inner">
                <h3 className="slide-caption-title">Better work days start here.</h3>
                <p className="slide-caption-sub">Tempo AI is the intelligence layer that lets you harness the knowledge of your entire workforce &mdash; instantly.</p>
                <a href="#" className="slide-arrow-btn">
                  <svg viewBox="0 0 20 20" fill="none"><path d="M4 10h12M10.5 5L16 10l-5.5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* SLIDE 3: Payroll */}
        <div className={`carousel-slide${current === 2 ? ' active' : ''}`}>
          <div className="dash-card">
            <div className="dash-bar">
              <div className="dots"><div className="dot r" /><div className="dot y" /><div className="dot g" /></div>
              <div className="addr">app.theworktempo.com/payroll</div>
            </div>
            <div className="dash-body">
              <div className="dash-hd"><span className="dash-ttl">Payroll Run &mdash; March 2026</span><span className="dash-qt">33 Countries</span></div>
              <div className="dash-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
                <div className="dg"><div className="dg-v">$4.2M</div><div className="dg-l">Total payroll</div><div className="dg-d">{'\u2191'} +3.1% vs Feb</div></div>
                <div className="dg"><div className="dg-v">14,203</div><div className="dg-l">Employees paid</div><div className="dg-d">{'\u2191'} 99.97% on time</div></div>
                <div className="dg"><div className="dg-v">33</div><div className="dg-l">Currencies</div><div className="dg-d" style={{ color: 'var(--muted)' }}>Auto-converted</div></div>
              </div>
              <table className="dash-tbl" style={{ marginTop: 14 }}>
                <thead><tr><th>Entity</th><th>Employees</th><th>Total</th><th>Status</th></tr></thead>
                <tbody>
                  <tr><td>ETI Ghana</td><td>2,140</td><td>GH{'\u20B5'}2.1M</td><td><span className="pill p-g">Processed</span></td></tr>
                  <tr><td>ETI Nigeria</td><td>3,820</td><td>{'\u20A6'}890M</td><td><span className="pill p-g">Processed</span></td></tr>
                  <tr><td>ETI Kenya</td><td>1,290</td><td>KES 48M</td><td><span className="pill p-y">In Review</span></td></tr>
                  <tr><td>ETI France</td><td>440</td><td>{'\u20AC'}1.2M</td><td><span className="pill p-g">Processed</span></td></tr>
                </tbody>
              </table>
              <div className="chips" style={{ marginTop: 12 }}>
                <div className="chip"><div className="chip-t">{'\u26A1'} Auto-reconciled</div><div className="chip-s">Zero manual adjustments</div></div>
                <div className="chip"><div className="chip-t">{'\uD83D\uDD12'} Compliance cleared</div><div className="chip-s">All 33 jurisdictions</div></div>
                <div className="chip"><div className="chip-t">{'\uD83D\uDCCB'} Tax filed</div><div className="chip-s">14 entities &middot; on time</div></div>
              </div>
            </div>
          </div>
        </div>

        {/* SLIDE 4: Performance photo card */}
        <div className={`carousel-slide${current === 3 ? ' active' : ''}`}>
          <div className="slide-photo-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=900&q=85&auto=format&fit=crop" alt="Performance management" className="slide-photo" />
            <div className="slide-caption">
              <div className="slide-caption-inner">
                <h3 className="slide-caption-title">Performance that moves the business forward.</h3>
                <p className="slide-caption-sub">Continuous feedback, calibration, and goal-setting &mdash; connected across every team in every country.</p>
                <a href="#" className="slide-arrow-btn">
                  <svg viewBox="0 0 20 20" fill="none"><path d="M4 10h12M10.5 5L16 10l-5.5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* SLIDE 5: Analytics */}
        <div className={`carousel-slide${current === 4 ? ' active' : ''}`}>
          <div className="dash-card">
            <div className="dash-bar">
              <div className="dots"><div className="dot r" /><div className="dot y" /><div className="dot g" /></div>
              <div className="addr">app.theworktempo.com/analytics</div>
            </div>
            <div className="dash-body">
              <div className="dash-hd"><span className="dash-ttl">People Analytics</span><span className="dash-qt">Live &middot; Global</span></div>
              <div className="dash-grid">
                <div className="dg"><div className="dg-v">8.3%</div><div className="dg-l">Turnover rate</div><div className="dg-d" style={{ color: '#16a34a' }}>{'\u2193'} -2.9% vs LY</div></div>
                <div className="dg"><div className="dg-v">24d</div><div className="dg-l">Time to hire</div><div className="dg-d" style={{ color: '#16a34a' }}>{'\u2193'} -6d vs Q3</div></div>
                <div className="dg"><div className="dg-v">94%</div><div className="dg-l">Retention</div><div className="dg-d">{'\u2191'} +3% vs Q3</div></div>
                <div className="dg"><div className="dg-v">4.1</div><div className="dg-l">Avg performance</div><div className="dg-d">{'\u2191'} +0.3 pts</div></div>
              </div>
              <div style={{ marginTop: 14, background: 'var(--bg)', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: 10 }}>Turnover by region &mdash; Q4 2026</div>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 7 }}>
                  {[
                    { region: 'West Africa', pct: '38%', color: 'var(--orange)', val: '8.3%' },
                    { region: 'East Africa', pct: '28%', color: '#16a34a', val: '6.1%' },
                    { region: 'Francophone', pct: '52%', color: '#f59e0b', val: '11.4%' },
                    { region: 'MENA', pct: '22%', color: '#16a34a', val: '4.8%' },
                  ].map(row => (
                    <div key={row.region} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
                      <span style={{ width: 90, color: 'var(--ink2)', fontWeight: 500 }}>{row.region}</span>
                      <div style={{ flex: 1, background: 'var(--surface)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                        <div style={{ width: row.pct, height: '100%', background: row.color, borderRadius: 4 }} />
                      </div>
                      <span style={{ color: row.color, fontWeight: 700, minWidth: 32 }}>{row.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Controls */}
      <div className="carousel-controls">
        <div className="carousel-dots" id="carouselDots">
          {Array.from({ length: slideCount }).map((_, i) => (
            <div
              key={i}
              ref={el => { dotsRef.current[i] = el }}
              className={`cdot${current === i ? ' active' : ''}`}
              style={{ '--slide-duration': `${SLIDE_DURATION}ms` } as React.CSSProperties}
              onClick={() => handleDotClick(i)}
            >
              <div className="cdot-fill" />
            </div>
          ))}
        </div>
        <button className="carousel-pause" onClick={togglePause} aria-label={paused ? 'Play autoplay' : 'Pause autoplay'}>
          {paused ? (
            <svg viewBox="0 0 20 20" fill="currentColor"><path d="M6 4l12 6-12 6V4z" /></svg>
          ) : (
            <svg viewBox="0 0 20 20" fill="currentColor"><rect x="5" y="4" width="3" height="12" rx="1" /><rect x="12" y="4" width="3" height="12" rx="1" /></svg>
          )}
        </button>
      </div>
    </div>
  )
}


/* ========== ACCORDION CARDS ========== */
interface AccordionCard {
  id: string
  label: string
  title: string
  desc: string
  imgSrc: string
  imgAlt: string
  cssClass: string
  links: { text: string; href: string }[]
}

const accordionData: AccordionCard[] = [
  {
    id: 'hr',
    label: 'HR',
    title: 'Human Resources',
    desc: 'Elevate the potential of your people and boost productivity across your organization with human-AI collaboration.',
    imgSrc: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=900&q=85&auto=format&fit=crop&crop=faces',
    imgAlt: 'HR professional',
    cssClass: 'acard-hr',
    links: [
      { text: 'People Management', href: '/products/hr' },
      { text: 'Talent Management', href: '#' },
      { text: 'Performance', href: '#' },
      { text: 'All HR', href: '/products/hr' },
    ],
  },
  {
    id: 'fin',
    label: 'Finance',
    title: 'Finance',
    desc: 'Double-entry GL, bank reconciliation, multi-entity consolidation. CFO-grade tools built in from day one.',
    imgSrc: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=900&q=85&auto=format&fit=crop&crop=faces',
    imgAlt: 'Finance professional',
    cssClass: 'acard-fin',
    links: [
      { text: 'General Ledger', href: '/products/finance' },
      { text: 'Payroll', href: '/products/payroll' },
      { text: 'Budgets', href: '#' },
      { text: 'All Finance', href: '/products/finance' },
    ],
  },
  {
    id: 'it',
    label: 'IT',
    title: 'IT',
    desc: 'Device management, SSO/SCIM provisioning, password vaults. Secure from day one, across every country you operate in.',
    imgSrc: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=900&q=85&auto=format&fit=crop&crop=faces',
    imgAlt: 'IT professional',
    cssClass: 'acard-it',
    links: [
      { text: 'Identity & Access', href: '#' },
      { text: 'Devices', href: '#' },
      { text: 'Apps', href: '#' },
      { text: 'All IT', href: '#' },
    ],
  },
  {
    id: 'ops',
    label: 'Operations',
    title: 'Operations',
    desc: 'Time tracking, shift scheduling, expense management, and travel. Put operations on autopilot across all your markets.',
    imgSrc: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=900&q=85&auto=format&fit=crop&crop=faces',
    imgAlt: 'Operations professional',
    cssClass: 'acard-ops',
    links: [
      { text: 'Time & Attendance', href: '#' },
      { text: 'Expenses', href: '#' },
      { text: 'Travel', href: '#' },
      { text: 'All Operations', href: '#' },
    ],
  },
  {
    id: 'emp',
    label: 'Employees',
    title: 'Employees',
    desc: 'Self-service leave, payslips, goals, learning, and Tempo AI \u2014 answers to any workforce question in seconds.',
    imgSrc: 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=900&q=85&auto=format&fit=crop&crop=faces',
    imgAlt: 'Employee self-service',
    cssClass: 'acard-emp',
    links: [
      { text: 'My Dashboard', href: '#' },
      { text: 'Tempo AI', href: '#' },
      { text: 'Learning', href: '/academy' },
      { text: 'All Employee Tools', href: '#' },
    ],
  },
]

export function AccordionCards() {
  const [active, setActive] = useState(0)

  const handleCardClick = useCallback((idx: number) => {
    if (idx !== active) setActive(idx)
  }, [active])

  const handleBtnClick = useCallback((e: React.MouseEvent, idx: number) => {
    e.stopPropagation()
    if (idx === active) {
      setActive(0)
    } else {
      setActive(idx)
    }
  }, [active])

  return (
    <div className="accordion-cards" id="modAccordion">
      {accordionData.map((card, idx) => (
        <div
          key={card.id}
          className={`acard ${card.cssClass}${idx === active ? ' active' : ''}`}
          data-idx={idx}
          onClick={() => handleCardClick(idx)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="acard-img" src={card.imgSrc} alt={card.imgAlt} />
          <div className="acard-overlay" />
          <div className="acard-inner">
            <div className="acard-label">{card.label}</div>
            <div className="acard-expanded-content">
              <h3 className="acard-title">{card.title}</h3>
              <p className="acard-desc">{card.desc}</p>
              <div className="acard-links">
                {card.links.map(link => (
                  <a key={link.text} className="acard-link" href={link.href}>{link.text} <span>&rarr;</span></a>
                ))}
              </div>
            </div>
            <button className="acard-btn" aria-label={`Expand ${card.label}`} onClick={(e) => handleBtnClick(e, idx)}>
              <svg viewBox="0 0 20 20" fill="none"><path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}


/* ========== SCROLL REVEAL ========== */
export function ScrollReveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisible(true)
          }
        })
      },
      { threshold: 0.08 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={ref} className={`reveal${visible ? ' on' : ''} ${className}`.trim()}>
      {children}
    </div>
  )
}
