import '../../landing.css'
import { LandingNav } from '@/components/marketing/landing-interactions'

const sections = [
  { name: 'Security', desc: 'SOC 2 Type II, GDPR, ISO 27001 frameworks. AES-256 encryption at rest, TLS 1.3 in transit. RBAC with row-level security.' },
  { name: 'Integrations', desc: '44 pre-built connectors. SAP, Workday, Oracle, Slack, Teams, Okta, Azure AD, and more. Bi-directional sync.' },
  { name: 'Analytics & Reporting', desc: 'Real-time dashboards, custom report builder, scheduled exports, and embedded BI. Every data point queryable.' },
  { name: 'Multi-Entity Support', desc: 'Unlimited legal entities, inter-company transactions, consolidated reporting, and entity-specific workflows.' },
  { name: 'Automation Engine', desc: 'Visual workflow builder with conditional logic, parallel paths, approvals, escalations, and cross-module triggers.' },
  { name: 'AI Engine', desc: '208 query patterns, natural language actions, what-if scenarios, and company knowledge base. Built on your data.' },
]

export default function PlatformProductPage() {
  return (
    <>
      <LandingNav />

      {/* HERO */}
      <section className="hero" style={{ minHeight: 'auto', paddingTop: 140, paddingBottom: 80 }}>
        <div className="hero-content" style={{ maxWidth: 700 }}>
          <div className="eyebrow"><span className="eyebrow-line" />Platform</div>
          <h1 className="hero-h1" style={{ fontSize: 'clamp(36px, 5vw, 64px)' }}>
            The platform<br /><em>underneath.</em>
          </h1>
          <p className="hero-p">
            311 database tables. 130 API routes. Enterprise security. Built for companies that refuse to compromise.
          </p>
          <div className="hero-btns">
            <a href="/demo-request" className="btn btn-orange">Request a Demo</a>
            <a href="/products/ai" className="btn btn-ghost">See Tempo AI</a>
          </div>
        </div>
      </section>

      {/* PLATFORM CAPABILITIES */}
      <section className="sec sec-alt">
        <div className="ey">Platform Capabilities</div>
        <h2 className="sh">Enterprise-grade.<br /><span className="a">No compromises.</span></h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20, marginTop: 40, maxWidth: 900 }}>
          {sections.map(s => (
            <div key={s.name} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 14, padding: 28 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--black)', marginBottom: 8 }}>{s.name}</h3>
              <p style={{ fontSize: 14, color: 'var(--ink2)', lineHeight: 1.7 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* STATS */}
      <section className="sec sec-dark">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 32, maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          {[
            { val: '311', label: 'Database tables' },
            { val: '130', label: 'API routes' },
            { val: '44', label: 'Integrations' },
            { val: '99.9%', label: 'Uptime SLA' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 48, fontWeight: 300, color: 'var(--orange)', letterSpacing: '-0.02em' }}>{s.val}</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-sec">
        <div className="cta-ey">Get started</div>
        <h2 className="cta-h">See the full<br /><span className="a">platform.</span></h2>
        <p className="cta-p">Book a technical deep-dive. We&apos;ll walk you through architecture, security, and integrations.</p>
        <div className="cta-btns">
          <a href="/demo-request" className="btn btn-orange">Request a Demo</a>
          <a href="/trial" className="btn btn-ghost">Start Free Trial</a>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="fg">
          <div>
            <div className="fb">tempo<span>.</span></div>
            <p className="ft">The unified workforce platform. HR, payroll, finance, IT, and AI in one data layer.</p>
          </div>
          <div>
            <div className="fch">Products</div>
            <ul className="fl">
              <li><a href="/products/hr">HR</a></li>
              <li><a href="/products/payroll">Payroll</a></li>
              <li><a href="/products/finance">Finance</a></li>
              <li><a href="/products/it">IT</a></li>
              <li><a href="/products/ai">Tempo AI</a></li>
            </ul>
          </div>
          <div>
            <div className="fch">Company</div>
            <ul className="fl">
              <li><a href="/about">About</a></li>
              <li><a href="/careers">Careers</a></li>
              <li><a href="/newsroom">Press</a></li>
              <li><a href="/contact">Contact</a></li>
            </ul>
          </div>
          <div>
            <div className="fch">Legal</div>
            <ul className="fl">
              <li><a href="/privacy">Privacy</a></li>
              <li><a href="/terms">Terms</a></li>
              <li><a href="/security">Security</a></li>
            </ul>
          </div>
        </div>
        <div className="fbot">
          <span className="fcopy">&copy; 2026 Tempo. All rights reserved.</span>
          <div className="flegal">
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Service</a>
            <a href="/cookies">Cookie Settings</a>
          </div>
        </div>
      </footer>
    </>
  )
}
