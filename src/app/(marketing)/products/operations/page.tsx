import '../../landing.css'
import { LandingNav } from '@/components/marketing/landing-interactions'

const modules = [
  { name: 'Time & Attendance', desc: 'Clock in/out, shift scheduling, overtime rules, and geofencing. Real-time dashboards for every location.' },
  { name: 'Expenses', desc: 'Receipt OCR, policy enforcement, multi-currency support, and auto-approval workflows.' },
  { name: 'Travel', desc: 'Booking, itinerary management, per-diem calculations, and duty-of-care compliance.' },
  { name: 'Workers\' Comp', desc: 'Claims tracking, return-to-work programs, and OSHA reporting built in.' },
  { name: 'Compliance', desc: 'Audit trails, regulatory reporting, and jurisdiction-specific labor law compliance.' },
  { name: 'Automation', desc: 'Workflow engine with conditional logic, escalations, and cross-module triggers.' },
]

export default function OperationsProductPage() {
  return (
    <>
      <LandingNav />

      {/* HERO */}
      <section className="hero" style={{ minHeight: 'auto', paddingTop: 140, paddingBottom: 80 }}>
        <div className="hero-content" style={{ maxWidth: 700 }}>
          <div className="eyebrow"><span className="eyebrow-line" />Operations</div>
          <h1 className="hero-h1" style={{ fontSize: 'clamp(36px, 5vw, 64px)' }}>
            Operations on<br /><em>autopilot.</em>
          </h1>
          <p className="hero-p">
            Time tracking, expenses, travel, compliance &mdash; all connected, all automated.
          </p>
          <div className="hero-btns">
            <a href="/demo-request" className="btn btn-orange">Request a Demo</a>
            <a href="/products/platform" className="btn btn-ghost">See Platform</a>
          </div>
        </div>
      </section>

      {/* MODULES */}
      <section className="sec sec-alt">
        <div className="ey">Modules</div>
        <h2 className="sh">Everything ops needs.<br /><span className="a">Connected.</span></h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20, marginTop: 40, maxWidth: 900 }}>
          {modules.map(m => (
            <div key={m.name} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 14, padding: 28 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--black)', marginBottom: 8 }}>{m.name}</h3>
              <p style={{ fontSize: 14, color: 'var(--ink2)', lineHeight: 1.7 }}>{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* STATS */}
      <section className="sec sec-dark">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 32, maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          {[
            { val: '6', label: 'Operations modules' },
            { val: '100%', label: 'Automated approvals' },
            { val: '0', label: 'Manual reconciliation' },
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
        <h2 className="cta-h">Put ops on<br /><span className="a">autopilot.</span></h2>
        <p className="cta-p">See how Tempo automates your operations across every market you operate in.</p>
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
