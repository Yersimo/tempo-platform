import Link from 'next/link'
import { ScrollRevealInit } from '@/components/marketing/scroll-reveal'

/* ─── Shared style constants ─── */
const maxW = { maxWidth: 1200, margin: '0 auto', padding: '0 24px' } as const
const sectionPad = { padding: 'clamp(60px, 8vw, 120px) 0' } as const

const navy = '#1a1a2e'
const orange = '#ea580c'
const blue = '#2563eb'
const green = '#16a34a'
const warmBg = 'linear-gradient(135deg, #fff7ed 0%, #fef3c7 50%, #fff7ed 100%)'
const blueBg = 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #eff6ff 100%)'
const heroBg = 'linear-gradient(135deg, #fff7ed 0%, #ffffff 50%, #f0f9ff 100%)'

/* ─── Cascade steps ─── */
const cascadeSteps = [
  'HRIS record created',
  'Onboarding journey assigned',
  'SSO access provisioned via SCIM',
  'Device ordered and shipped',
  'Mandatory training enrolled',
  'Buddy mentor matched',
  'Welcome moment created',
  '90-day review scheduled',
  'Day 30 + Day 90 pulse surveys queued',
]

/* ─── Module pillars ─── */
const modulePillars = [
  {
    title: 'People & HR',
    color: orange,
    href: '/products/hr',
    modules: [
      'People', 'Recruiting', 'Performance', 'Learning', 'Compensation',
      'Succession', 'Skills', 'Org Chart', 'Mentoring', 'Engagement',
      'Onboarding', 'Offboarding', 'Team Calendar', 'Talent Marketplace',
    ],
  },
  {
    title: 'Finance & Operations',
    color: blue,
    href: '/products/finance',
    modules: [
      'Payroll', 'GL', 'Invoices', 'Budgets', 'Expenses', 'Travel',
      'Bank Feeds', 'Consolidation', 'Revenue', 'Procurement',
      'Corporate Cards', 'Bill Pay', 'Transfer Pricing',
    ],
  },
  {
    title: 'IT & Security',
    color: green,
    href: '/products/hr',
    modules: [
      'Devices', 'Identity', 'Apps', 'Passwords', 'Compliance',
      'Automation', 'Documents', 'Chat', 'Analytics',
    ],
  },
]

/* ─── Journey data ─── */
const journeys = [
  { icon: '🚀', title: 'Hire-to-Perform', desc: '12 modules, 1 click. From offer letter to first performance review.' },
  { icon: '👋', title: 'Employee Exit', desc: 'Secure in hours, not weeks. Access revoked, assets returned, knowledge transferred.' },
  { icon: '🔮', title: 'Predict & Retain', desc: 'AI flags risks before resignations. Intervene with data, not guesswork.' },
  { icon: '📊', title: 'Close the Books', desc: 'Board pack in 30 seconds. Financial close with one click.' },
  { icon: '📈', title: 'Develop & Promote', desc: '9-box to promotion, tracked. Skills, mentoring, and succession in one flow.' },
  { icon: '🌍', title: 'Global Expand', desc: 'New country in days, not months. Statutory compliance built in.' },
]

/* ─── Security features ─── */
const securityFeatures = [
  { icon: '🔐', label: 'AES-256-GCM encryption with per-tenant keys' },
  { icon: '🔑', label: 'SAML 2.0 + OIDC single sign-on' },
  { icon: '👥', label: 'SCIM 2.0 automated provisioning' },
  { icon: '📱', label: 'MFA with TOTP authenticator' },
  { icon: '📋', label: 'SOC 2 Type II framework (19 controls)' },
  { icon: '🛡️', label: 'PostgreSQL RLS multi-tenant isolation' },
  { icon: '🌍', label: 'GDPR, NDPR, POPIA compliant' },
  { icon: '📝', label: 'Tamper-evident audit logging' },
]

/* ─── Payroll countries ─── */
const payrollCountries = [
  { flag: '🇬🇭', name: 'Ghana', detail: 'PAYE + SSNIT' },
  { flag: '🇳🇬', name: 'Nigeria', detail: 'PAYE + NHF + Form H1' },
  { flag: '🇰🇪', name: 'Kenya', detail: 'PAYE + NHIF + P9A' },
  { flag: '🇿🇦', name: 'South Africa', detail: 'PAYE + UIF + SDL' },
  { flag: '🇮🇳', name: 'India', detail: 'PF + ESI + PT + TDS + Form 16' },
  { flag: '🇧🇷', name: 'Brazil', detail: 'INSS + FGTS + IRRF + 13th + CLT' },
]

/* ═══════════════════════════════════════════════════════════════ */

export default function LandingPage() {
  return (
    <div style={{ fontFamily: 'inherit', color: navy, overflowX: 'hidden' }}>
      <ScrollRevealInit />

      {/* ═══ NAVIGATION ═══ */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        padding: '0 24px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ ...maxW, display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <Link href="/" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', textDecoration: 'none', color: navy }}>
              tempo<span style={{ color: orange }}>.</span>
            </Link>
            <div style={{ display: 'flex', gap: 24 }}>
              {[
                { label: 'Platform', href: '/products/hr' },
                { label: 'Pricing', href: '/pricing' },
                { label: 'Academy', href: '/academy' },
                { label: 'Security', href: '/security' },
              ].map((l) => (
                <Link key={l.label} href={l.href} style={{ fontSize: 14, fontWeight: 500, color: '#555', textDecoration: 'none' }}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/login" style={{ fontSize: 14, fontWeight: 500, color: navy, textDecoration: 'none', padding: '8px 16px' }}>
              Sign In
            </Link>
            <Link href="/demo-request" style={{
              fontSize: 14, fontWeight: 600, color: '#fff', textDecoration: 'none',
              background: orange, padding: '10px 20px', borderRadius: 10,
            }}>
              Request a Demo
            </Link>
          </div>
        </div>
      </nav>


      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION 1: HERO — Light/warm background                       */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section style={{ background: heroBg, ...sectionPad, paddingTop: 'clamp(80px, 10vw, 140px)', paddingBottom: 'clamp(60px, 8vw, 100px)' }}>
        <div style={{ ...maxW, textAlign: 'center' }}>
          {/* Badge */}
          <div className="l-reveal" style={{
            display: 'inline-block', padding: '8px 20px', borderRadius: 100,
            background: 'rgba(234,88,12,0.08)', color: orange,
            fontSize: 13, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
            marginBottom: 24,
          }}>
            The Unified Workforce Platform
          </div>

          {/* Headline */}
          <h1 className="l-reveal" style={{
            fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 800, lineHeight: 1.1,
            letterSpacing: '-0.03em', color: navy, margin: '0 0 24px',
          }}>
            One employee record.<br />
            50+ integrated modules.<br />
            Built for <em style={{ fontStyle: 'normal', color: orange }}>global enterprise.</em>
          </h1>

          {/* Sub */}
          <p className="l-reveal" style={{
            fontSize: 'clamp(16px, 1.4vw, 20px)', color: '#555', lineHeight: 1.7,
            maxWidth: 640, margin: '0 auto 40px',
          }}>
            HR, payroll, finance, IT, and AI in one platform.<br />
            One data layer. One permissions engine.
          </p>

          {/* CTAs */}
          <div className="l-reveal" style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 64 }}>
            <Link href="/demo-request" style={{
              background: orange, color: '#fff', padding: '16px 32px', borderRadius: 10,
              fontSize: 16, fontWeight: 600, textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(234,88,12,0.3)',
            }}>
              Request a Demo
            </Link>
            <Link href="/signup" style={{
              background: 'transparent', color: navy, padding: '16px 32px', borderRadius: 10,
              fontSize: 16, fontWeight: 600, textDecoration: 'none',
              border: `2px solid ${navy}`,
            }}>
              Start Free Trial &rarr;
            </Link>
          </div>

          {/* Dashboard mockup */}
          <div className="l-reveal-scale" style={{ position: 'relative', maxWidth: 960, margin: '0 auto' }}>
            {/* Main dashboard card */}
            <div style={{
              background: '#fff', borderRadius: 20, padding: 'clamp(24px, 3vw, 40px)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.08), 0 4px 20px rgba(0,0,0,0.04)',
              border: '1px solid rgba(0,0,0,0.06)',
            }}>
              {/* Dashboard header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Dashboard</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: navy }}>Good morning, Amara</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['Overview', 'Team', 'Finance'].map((t, i) => (
                    <div key={t} style={{
                      padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                      background: i === 0 ? navy : '#f5f5f5', color: i === 0 ? '#fff' : '#666',
                    }}>{t}</div>
                  ))}
                </div>
              </div>

              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
                {[
                  { label: 'Total Employees', value: '2,847', change: '+12', color: green },
                  { label: 'Open Positions', value: '34', change: '-3', color: blue },
                  { label: 'Payroll This Month', value: 'GH\u20B5 1.2M', change: '+2.1%', color: orange },
                  { label: 'Compliance Score', value: '98.4%', change: '+0.8', color: green },
                ].map((s) => (
                  <div key={s.label} style={{ background: '#fafafa', borderRadius: 12, padding: 16 }}>
                    <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: navy }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: s.color, fontWeight: 600 }}>{s.change}</div>
                  </div>
                ))}
              </div>

              {/* Mini table */}
              <div style={{ background: '#fafafa', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#888', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Recent Activity</div>
                {[
                  { name: 'Thabo Molefe', action: 'Promoted to Senior Engineer', time: '2h ago', dot: green },
                  { name: 'Priya Sharma', action: 'Completed AML Training', time: '3h ago', dot: blue },
                  { name: 'Jan van der Berg', action: 'Onboarding complete (9 systems)', time: '5h ago', dot: orange },
                  { name: 'Wanjiku Kamau', action: 'Leave request approved', time: '6h ago', dot: '#8b5cf6' },
                ].map((r) => (
                  <div key={r.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.dot }} />
                      <span style={{ fontSize: 14, fontWeight: 600, color: navy }}>{r.name}</span>
                      <span style={{ fontSize: 13, color: '#888' }}>{r.action}</span>
                    </div>
                    <span style={{ fontSize: 12, color: '#aaa' }}>{r.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating notification cards */}
            <div className="l-float-card" style={{
              position: 'absolute', top: -20, right: -30, background: '#fff', borderRadius: 14,
              padding: '14px 20px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
              display: 'flex', alignItems: 'center', gap: 12, animation: 'floatUp 6s ease-in-out infinite',
              border: '1px solid rgba(0,0,0,0.05)', zIndex: 2,
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(22,163,74,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>✓</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: navy }}>Payroll Processed</div>
                <div style={{ fontSize: 12, color: '#888' }}>12 employees &middot; GH₵29,486.80</div>
              </div>
            </div>

            <div className="l-float-card" style={{
              position: 'absolute', bottom: 40, left: -40, background: '#fff', borderRadius: 14,
              padding: '14px 20px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
              display: 'flex', alignItems: 'center', gap: 12, animation: 'floatUp 6s ease-in-out infinite 1s',
              border: '1px solid rgba(0,0,0,0.05)', zIndex: 2,
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(234,88,12,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>⚡</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: navy }}>New Hire Onboarded</div>
                <div style={{ fontSize: 12, color: '#888' }}>Priya S. &middot; 9 systems updated</div>
              </div>
            </div>

            <div className="l-float-card" style={{
              position: 'absolute', bottom: -10, right: 40, background: '#fff', borderRadius: 14,
              padding: '14px 20px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
              display: 'flex', alignItems: 'center', gap: 12, animation: 'floatUp 6s ease-in-out infinite 2s',
              border: '1px solid rgba(0,0,0,0.05)', zIndex: 2,
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎓</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: navy }}>Certificate Issued</div>
                <div style={{ fontSize: 12, color: '#888' }}>Jan van der Berg &middot; AML Compliance</div>
              </div>
            </div>
          </div>

          {/* Integration logos */}
          <div className="l-reveal" style={{ marginTop: 56, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 'clamp(24px, 4vw, 48px)', alignItems: 'center' }}>
            {['SAP', 'Workday', 'Oracle', 'Active Directory', 'Okta', 'Mercer'].map((l) => (
              <span key={l} style={{ fontSize: 14, fontWeight: 600, color: '#bbb', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{l}</span>
            ))}
          </div>

          {/* Stats */}
          <div className="l-reveal" style={{ marginTop: 40, display: 'flex', justifyContent: 'center', gap: 'clamp(32px, 5vw, 80px)', flexWrap: 'wrap' }}>
            {[
              { val: '50K+', label: 'EMPLOYEES' },
              { val: '80+', label: 'COUNTRIES' },
              { val: '99.9%', label: 'UPTIME' },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 'clamp(28px, 3vw, 40px)', fontWeight: 800, color: navy }}>{s.val}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#999', letterSpacing: '0.1em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION 2: THE PROBLEM — White                                */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#fff', ...sectionPad }}>
        <div style={{ ...maxW, textAlign: 'center', maxWidth: 760 }}>
          <div className="l-reveal" style={{ fontSize: 12, fontWeight: 700, color: orange, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>
            The Problem
          </div>
          <h2 className="l-reveal" style={{ fontSize: 'clamp(30px, 4vw, 48px)', fontWeight: 800, lineHeight: 1.15, color: navy, marginBottom: 32 }}>
            The $4,200-per-employee problem.
          </h2>
          <div className="l-reveal" style={{ fontSize: 'clamp(16px, 1.3vw, 19px)', color: '#555', lineHeight: 1.8 }}>
            <p style={{ marginBottom: 24 }}>
              The average company uses 12 HR tools that don&apos;t talk to each other.
            </p>
            <p style={{ marginBottom: 24 }}>
              When <strong>Amara Okafor</strong> gets promoted, you update 8 systems manually.
              When <strong>Pieter Bakker</strong> leaves, IT access stays open for 3 weeks.
              When <strong>Deepa Krishnan</strong> requests a transfer, nobody knows who approved it.
            </p>
            <p style={{ fontSize: 'clamp(20px, 2vw, 28px)', fontWeight: 700, color: navy, marginTop: 40 }}>
              There&apos;s a better way.
            </p>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION 3: SOLUTION CASCADE — Navy                            */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section style={{ background: navy, color: '#fff', ...sectionPad }}>
        <div style={{ ...maxW }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div className="l-reveal" style={{ fontSize: 12, fontWeight: 700, color: orange, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>
              The Solution
            </div>
            <h2 className="l-reveal" style={{ fontSize: 'clamp(30px, 4vw, 48px)', fontWeight: 800, lineHeight: 1.15, marginBottom: 16 }}>
              One platform. Zero gaps.
            </h2>
            <p className="l-reveal" style={{ fontSize: 'clamp(16px, 1.3vw, 19px)', color: 'rgba(255,255,255,0.6)', maxWidth: 600, margin: '0 auto' }}>
              When you hire someone in Tempo, 9 things happen automatically:
            </p>
          </div>

          {/* Cascade list */}
          <div className="l-stagger-children" style={{ maxWidth: 640, margin: '0 auto 48px' }}>
            {cascadeSteps.map((step, i) => (
              <div key={i} className="l-reveal" style={{
                display: 'flex', alignItems: 'center', gap: 20, padding: '16px 0',
                borderBottom: i < cascadeSteps.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                  background: `linear-gradient(135deg, ${orange}, #f97316)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700, color: '#fff',
                }}>
                  {i + 1}
                </div>
                <span style={{ fontSize: 'clamp(15px, 1.2vw, 17px)', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                  {step}
                </span>
              </div>
            ))}
          </div>

          <div className="l-reveal" style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', marginBottom: 32 }}>
              No Zapier. No spreadsheets. No manual triggers.<br />
              This is what &ldquo;integrated&rdquo; actually means.
            </p>
            <Link href="/customer-journeys" style={{ color: orange, fontSize: 16, fontWeight: 600, textDecoration: 'none' }}>
              See it in action &rarr;
            </Link>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION 4: REAL RESULTS — Warm gradient                       */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section style={{ background: warmBg, ...sectionPad }}>
        <div style={{ ...maxW }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div className="l-reveal" style={{ fontSize: 12, fontWeight: 700, color: orange, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>
              Real Results
            </div>
            <h2 className="l-reveal" style={{ fontSize: 'clamp(30px, 4vw, 48px)', fontWeight: 800, lineHeight: 1.15, color: navy }}>
              Built for teams that move fast.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {[
              {
                metric: '12 → 1', label: 'tools consolidated',
                gradient: `linear-gradient(135deg, ${navy}, #2a2a4e)`,
                desc: 'Replace your entire HR stack. One platform replaces BambooHR + Gusto + Lattice + Cornerstone. One login. One invoice.',
              },
              {
                metric: '30s', label: 'board pack generation',
                gradient: `linear-gradient(135deg, ${orange}, #f97316)`,
                desc: 'Board reports in seconds, not weeks. Auto-generated quarterly packs with live data from every module.',
              },
              {
                metric: '9', label: 'auto-actions per hire',
                gradient: `linear-gradient(135deg, ${green}, #22c55e)`,
                desc: 'Hire once, update everywhere. HRIS, onboarding, SSO, devices, training, mentoring, moment, review, surveys.',
              },
            ].map((card) => (
              <div key={card.label} className="l-reveal" style={{
                background: '#fff', borderRadius: 20, overflow: 'hidden',
                boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
              }}>
                <div style={{ background: card.gradient, padding: '32px 28px', textAlign: 'center' }}>
                  <div style={{ fontSize: 'clamp(40px, 5vw, 56px)', fontWeight: 800, color: '#fff' }}>{card.metric}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{card.label}</div>
                </div>
                <div style={{ padding: '24px 28px' }}>
                  <p style={{ fontSize: 15, color: '#666', lineHeight: 1.7 }}>{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION 5: MODULE SHOWCASE — White                            */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#fff', ...sectionPad }}>
        <div style={{ ...maxW }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div className="l-reveal" style={{ fontSize: 12, fontWeight: 700, color: orange, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>
              Everything Your Workforce Needs
            </div>
            <h2 className="l-reveal" style={{ fontSize: 'clamp(30px, 4vw, 48px)', fontWeight: 800, lineHeight: 1.15, color: navy }}>
              50+ modules. One platform.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
            {modulePillars.map((pillar) => (
              <Link key={pillar.title} href={pillar.href} className="l-reveal" style={{
                background: '#fafafa', borderRadius: 20, padding: 32, textDecoration: 'none', color: 'inherit',
                border: '1px solid rgba(0,0,0,0.06)',
                transition: 'box-shadow 0.3s, transform 0.3s',
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14, marginBottom: 20,
                  background: `${pillar.color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ width: 20, height: 20, borderRadius: 6, background: pillar.color }} />
                </div>
                <h3 style={{ fontSize: 22, fontWeight: 700, color: navy, marginBottom: 16 }}>{pillar.title}</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {pillar.modules.map((m) => (
                    <span key={m} style={{
                      padding: '6px 14px', borderRadius: 100, fontSize: 13, fontWeight: 500,
                      background: '#fff', color: '#555', border: '1px solid rgba(0,0,0,0.08)',
                    }}>
                      {m}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION 6: TEMPO AI — Blue gradient                           */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section style={{ background: blueBg, ...sectionPad }}>
        <div style={{ ...maxW }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div className="l-reveal" style={{ fontSize: 12, fontWeight: 700, color: blue, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>
              Tempo AI
            </div>
            <h2 className="l-reveal" style={{ fontSize: 'clamp(30px, 4vw, 48px)', fontWeight: 800, lineHeight: 1.15, color: navy }}>
              Ask anything. Do anything. From anywhere.
            </h2>
          </div>

          <div className="l-reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 48, alignItems: 'center' }}>
            {/* Left: description */}
            <div>
              <p style={{ fontSize: 'clamp(16px, 1.3vw, 19px)', color: '#444', lineHeight: 1.8, marginBottom: 32 }}>
                Tempo AI understands your company&apos;s data and policies.
                Ask questions, take actions, create documents — all from
                a single conversational interface.
              </p>
              <Link href="/products/hr" style={{ color: blue, fontSize: 16, fontWeight: 600, textDecoration: 'none' }}>
                Try Tempo AI &rarr;
              </Link>
            </div>

            {/* Right: chat mockup */}
            <div style={{
              background: '#fff', borderRadius: 20, padding: 'clamp(20px, 3vw, 32px)',
              boxShadow: '0 10px 40px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)',
            }}>
              {/* Chat header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg, ${blue}, #60a5fa)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 700 }}>AI</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: navy }}>Tempo AI</div>
              </div>

              {/* Messages */}
              {[
                { from: 'user', name: 'Amara', text: 'Who\'s on leave this week in the Accra branch?' },
                { from: 'ai', name: 'AI', text: '3 people are on leave:\n\u2022 Thabo M. (annual leave)\n\u2022 Fatima A. (sick leave)\n\u2022 Sofia R. (personal day)' },
                { from: 'user', name: 'Amara', text: 'What if we hire 5 more engineers?' },
                { from: 'ai', name: 'AI', text: '📊 Current headcount: 24 → 29\nAnnual cost impact: GHS 300,000\nTeam growth: +21%' },
              ].map((msg, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 10, marginBottom: 16,
                  justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start',
                }}>
                  <div style={{
                    maxWidth: '80%', padding: '12px 16px', borderRadius: 14,
                    background: msg.from === 'user' ? navy : '#f5f5f5',
                    color: msg.from === 'user' ? '#fff' : navy,
                    fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-line',
                  }}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION 7: CUSTOMER JOURNEYS — Light gray                     */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#fafafa', ...sectionPad }}>
        <div style={{ ...maxW }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div className="l-reveal" style={{ fontSize: 12, fontWeight: 700, color: orange, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>
              Proven Integration
            </div>
            <h2 className="l-reveal" style={{ fontSize: 'clamp(30px, 4vw, 48px)', fontWeight: 800, lineHeight: 1.15, color: navy }}>
              6 journeys. Zero manual steps.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            {journeys.map((j) => (
              <div key={j.title} className="l-reveal" style={{
                background: '#fff', borderRadius: 16, padding: 28,
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
              }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{j.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: navy, marginBottom: 8 }}>{j.title}</h3>
                <p style={{ fontSize: 14, color: '#666', lineHeight: 1.7 }}>{j.desc}</p>
              </div>
            ))}
          </div>

          <div className="l-reveal" style={{ textAlign: 'center', marginTop: 40 }}>
            <Link href="/customer-journeys" style={{ color: orange, fontSize: 16, fontWeight: 600, textDecoration: 'none' }}>
              See all journeys &rarr;
            </Link>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION 8: TESTIMONIAL — Navy                                 */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section style={{ background: navy, color: '#fff', ...sectionPad }}>
        <div style={{ ...maxW, textAlign: 'center', maxWidth: 800 }}>
          <div className="l-reveal" style={{ fontSize: 80, color: orange, lineHeight: 1, marginBottom: 24 }}>&ldquo;</div>
          <blockquote className="l-reveal" style={{ fontSize: 'clamp(18px, 2vw, 26px)', fontWeight: 500, lineHeight: 1.7, color: 'rgba(255,255,255,0.9)', margin: '0 0 32px', fontStyle: 'normal' }}>
            The moment I saw one hire trigger 9 systems automatically,
            I knew we were looking at something different. This isn&apos;t
            an HR tool with integrations bolted on — it&apos;s a unified
            platform from the ground up.
          </blockquote>
          <div className="l-reveal">
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
              — What our early adopters tell us
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
              HR Director, Pan-African Financial Services
            </div>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION 9: SECURITY — White                                   */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#fff', ...sectionPad }}>
        <div style={{ ...maxW }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div className="l-reveal" style={{ fontSize: 12, fontWeight: 700, color: orange, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>
              Enterprise Security
            </div>
            <h2 className="l-reveal" style={{ fontSize: 'clamp(30px, 4vw, 48px)', fontWeight: 800, lineHeight: 1.15, color: navy }}>
              Your data, protected.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {securityFeatures.map((f) => (
              <div key={f.label} className="l-reveal" style={{
                padding: '24px 28px', borderRadius: 16,
                border: '1px solid rgba(0,0,0,0.08)', background: '#fafafa',
                display: 'flex', alignItems: 'flex-start', gap: 16,
              }}>
                <span style={{ fontSize: 24, flexShrink: 0 }}>{f.icon}</span>
                <span style={{ fontSize: 15, color: '#444', lineHeight: 1.6, fontWeight: 500 }}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION 10: GLOBAL PAYROLL — Warm gradient                    */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section style={{ background: 'linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%)', ...sectionPad }}>
        <div style={{ ...maxW }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div className="l-reveal" style={{ fontSize: 12, fontWeight: 700, color: orange, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>
              Global Payroll
            </div>
            <h2 className="l-reveal" style={{ fontSize: 'clamp(30px, 4vw, 48px)', fontWeight: 800, lineHeight: 1.15, color: navy }}>
              Real payroll. Real compliance.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 32 }}>
            {payrollCountries.map((c) => (
              <div key={c.name} className="l-reveal" style={{
                background: '#fff', borderRadius: 16, padding: '20px 24px',
                display: 'flex', alignItems: 'center', gap: 16,
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)',
              }}>
                <span style={{ fontSize: 32 }}>{c.flag}</span>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: navy }}>{c.name}</div>
                  <div style={{ fontSize: 13, color: '#888' }}>{c.detail}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="l-reveal" style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 16, color: '#888', marginBottom: 8 }}>+ 95 more countries</p>
            <p style={{ fontSize: 14, color: '#aaa', marginBottom: 24 }}>
              7 payment formats: NACHA, SEPA, BACS, NIBSS, GhIPSS, Kenya RTGS, India NEFT
            </p>
            <Link href="/products/payroll" style={{ color: orange, fontSize: 16, fontWeight: 600, textDecoration: 'none' }}>
              Explore Payroll &rarr;
            </Link>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION 11: HOW IT WORKS — White                              */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#fff', ...sectionPad }}>
        <div style={{ ...maxW, textAlign: 'center' }}>
          <div className="l-reveal" style={{ fontSize: 12, fontWeight: 700, color: orange, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>
            Get Started
          </div>
          <h2 className="l-reveal" style={{ fontSize: 'clamp(30px, 4vw, 48px)', fontWeight: 800, lineHeight: 1.15, color: navy, marginBottom: 8 }}>
            Live in days, not months.
          </h2>
          <p className="l-reveal" style={{ fontSize: 16, color: '#888', marginBottom: 64 }}>
            No 6-month implementation. No army of consultants.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32 }}>
            {[
              { num: '1', title: 'Book a Demo', desc: '30 minutes, personalized to your use case. We\u2019ll show you exactly how Tempo fits your organization.' },
              { num: '2', title: 'Configure & Import', desc: 'Upload employees, set up departments, configure payroll rules. Our team handles the heavy lifting.' },
              { num: '3', title: 'Go Live', desc: 'Run your first payroll, watch the event cascade fire. See 9 systems update from a single action.' },
            ].map((step) => (
              <div key={step.num} className="l-reveal" style={{ textAlign: 'center' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%', margin: '0 auto 20px',
                  background: `linear-gradient(135deg, ${orange}, #f97316)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, fontWeight: 800, color: '#fff',
                  boxShadow: '0 4px 20px rgba(234,88,12,0.3)',
                }}>
                  {step.num}
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: navy, marginBottom: 8 }}>{step.title}</h3>
                <p style={{ fontSize: 15, color: '#666', lineHeight: 1.7 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION 12: CTA — Warm gradient                               */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section style={{ background: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)', ...sectionPad }}>
        <div style={{ ...maxW, textAlign: 'center', maxWidth: 720 }}>
          <h2 className="l-reveal" style={{ fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: 800, lineHeight: 1.2, color: navy, marginBottom: 24 }}>
            Ready to see what one platform can do?
          </h2>
          <p className="l-reveal" style={{ fontSize: 'clamp(16px, 1.3vw, 18px)', color: '#555', lineHeight: 1.7, marginBottom: 40 }}>
            Book a 30-minute demo and we&apos;ll show you exactly how Tempo
            works for your company — with your data, your modules,
            your compliance requirements.
          </p>

          <div className="l-reveal" style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 32 }}>
            <Link href="/demo-request" style={{
              background: orange, color: '#fff', padding: '16px 32px', borderRadius: 10,
              fontSize: 16, fontWeight: 600, textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(234,88,12,0.3)',
            }}>
              Request a Demo
            </Link>
            <Link href="/signup" style={{
              background: navy, color: '#fff', padding: '16px 32px', borderRadius: 10,
              fontSize: 16, fontWeight: 600, textDecoration: 'none',
            }}>
              Start Free Trial
            </Link>
          </div>

          <p className="l-reveal" style={{ fontSize: 14, color: '#888' }}>
            Or email us directly: <a href="mailto:hello@theworktempo.com" style={{ color: orange, textDecoration: 'none', fontWeight: 500 }}>hello@theworktempo.com</a>
          </p>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION 13: FOOTER — Navy                                     */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <footer style={{ background: navy, color: 'rgba(255,255,255,0.6)', padding: 'clamp(48px, 6vw, 80px) 0 40px' }}>
        <div style={{ ...maxW }}>
          {/* Top */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 40, marginBottom: 56 }}>
            {/* Brand */}
            <div style={{ gridColumn: 'span 1' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', marginBottom: 12 }}>
                tempo<span style={{ color: orange }}>.</span>
              </div>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>
                The unified workforce platform.
              </p>
            </div>

            {/* Links */}
            {[
              {
                title: 'Products',
                links: [
                  { label: 'People & HR', href: '/products/hr' },
                  { label: 'Finance', href: '/products/finance' },
                  { label: 'Payroll', href: '/products/payroll' },
                  { label: 'Pricing', href: '/pricing' },
                ],
              },
              {
                title: 'Company',
                links: [
                  { label: 'About', href: '/about' },
                  { label: 'Careers', href: '/careers' },
                  { label: 'Security', href: '/security' },
                  { label: 'Contact', href: '/contact' },
                ],
              },
              {
                title: 'Resources',
                links: [
                  { label: 'Academy', href: '/academy' },
                  { label: 'Customer Journeys', href: '/customer-journeys' },
                  { label: 'Why Tempo', href: '/why-tempo' },
                  { label: 'Blog', href: '/blog' },
                ],
              },
              {
                title: 'Legal',
                links: [
                  { label: 'Privacy', href: '/privacy' },
                  { label: 'Terms', href: '/terms' },
                  { label: 'Cookies', href: '/cookies' },
                  { label: 'GDPR', href: '/gdpr' },
                ],
              },
            ].map((col) => (
              <div key={col.title}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
                  {col.title}
                </div>
                {col.links.map((l) => (
                  <Link key={l.label} href={l.href} style={{ display: 'block', fontSize: 14, color: 'rgba(255,255,255,0.45)', textDecoration: 'none', marginBottom: 10, lineHeight: 1.5 }}>
                    {l.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>

          {/* Bottom */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
              SOC 2 COMPLIANT &middot; GDPR READY
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
              &copy; 2026 Tempo. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
