import '../../landing.css'
import { LandingNav } from '@/components/marketing/landing-interactions'

const modules = [
  { name: 'People & HRIS', desc: 'Single employee record, custom fields, effective-dated history' },
  { name: 'Recruiting', desc: '10-stage ATS, AI screening, career site, DEI analytics' },
  { name: 'Performance', desc: '360 feedback, calibration, OKR alignment, goal templates' },
  { name: 'Learning', desc: 'SCORM LMS, 12+ tabs, auto-enrollment, certificates' },
  { name: 'Compensation', desc: 'Comp bands, equity grants, STIP calculator, pay equity' },
  { name: 'Succession', desc: '9-box grid, bench strength, flight risk, talent reviews' },
  { name: 'Skills', desc: 'Gap analysis, proficiency tracking, development plans' },
  { name: 'Engagement', desc: 'Pulse surveys, eNPS, action plans, sentiment analysis' },
  { name: 'Onboarding', desc: '6-step wizard, localized journeys, auto-enrollment' },
  { name: 'Offboarding', desc: 'Checklists by type, access revocation, exit surveys' },
  { name: 'Org Chart', desc: 'Interactive tree, span of control, department filtering' },
  { name: 'Team Calendar', desc: 'Gantt leave view, conflict alerts, coverage planning' },
  { name: 'Mentoring', desc: 'AI matching, 6 program types, ROI measurement' },
  { name: 'Talent Marketplace', desc: 'Internal gigs, skill matching, career paths' },
  { name: 'Moments', desc: '12 celebration types, automated recognition' },
]

const cascadeSteps = [
  'Hire approved',
  'HRIS record created',
  'Onboarding journey triggered',
  'SSO provisioned',
  'Device assigned',
  'Training enrolled',
  'Mentor matched',
  'Moment created',
  'Org chart updated',
]

export default function HRProductPage() {
  return (
    <>
      <LandingNav />

      {/* HERO */}
      <section className="hero-center" style={{ minHeight: 'auto', paddingTop: 140, paddingBottom: 80 }}>
        <div className="hero-content" style={{ maxWidth: 700 }}>
          <div className="eyebrow"><span className="eyebrow-line" />HR PLATFORM</div>
          <h1 className="hero-h1" style={{ fontSize: 'clamp(36px, 5vw, 64px)' }}>
            People management that<br />actually <em>manages people.</em>
          </h1>
          <p className="hero-p">
            From hire to retire, every step automated. Every record connected. Every decision informed by real data.
          </p>
          <div className="hero-btns">
            <a href="/demo-request" className="btn btn-orange">Request a Demo</a>
            <a href="/contact" className="btn btn-ghost">Contact Sales</a>
          </div>
        </div>
      </section>

      {/* 15 HR MODULES */}
      <section className="sec sec-alt">
        <div className="ey">15 HR Modules</div>
        <h2 className="sh">Everything your HR team needs.<br /><span className="a">Nothing they don&apos;t.</span></h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20, marginTop: 40, maxWidth: 1000 }}>
          {modules.map(m => (
            <div key={m.name} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 18, padding: 32 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--black)', marginBottom: 8 }}>{m.name}</h3>
              <p style={{ fontSize: 14, color: 'var(--ink2)', lineHeight: 1.7 }}>{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HIRE-TO-PERFORM CASCADE */}
      <section className="sec sec-dark">
        <div className="ey" style={{ justifyContent: 'center' }}>Key Feature</div>
        <h2 className="sh" style={{ textAlign: 'center', margin: '0 auto 16px' }}>
          The Hire-to-Perform <span className="a">Cascade</span>
        </h2>
        <p className="sp" style={{ textAlign: 'center', maxWidth: 500, margin: '0 auto 48px' }}>
          9 steps that fire automatically when you hire someone. Zero manual handoffs.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', maxWidth: 900, margin: '0 auto' }}>
          {cascadeSteps.map((step, i) => (
            <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                background: 'rgba(234,88,12,0.12)',
                border: '1px solid rgba(234,88,12,0.2)',
                borderRadius: 12,
                padding: '12px 20px',
                fontSize: 14,
                color: '#fb923c',
                fontWeight: 500,
                whiteSpace: 'nowrap',
              }}>
                <span style={{ fontSize: 11, opacity: 0.5, marginRight: 8 }}>{i + 1}</span>
                {step}
              </div>
              {i < cascadeSteps.length - 1 && (
                <svg style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.15)', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5l7 7-7 7" /></svg>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* STATS */}
      <section className="sec">
        <div className="ey" style={{ justifyContent: 'center' }}>By the Numbers</div>
        <h2 className="sh" style={{ textAlign: 'center', margin: '0 auto 48px' }}>
          Built for <span className="a">depth.</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 32, maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          {[
            { val: '15', label: 'HR modules' },
            { val: '53/53', label: 'QA lifecycle tests pass' },
            { val: '208', label: 'AI query patterns' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 48, fontWeight: 300, color: 'var(--orange)', letterSpacing: '-0.02em' }}>{s.val}</div>
              <div style={{ fontSize: 14, color: 'var(--ink2)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-sec">
        <div className="cta-ey">Get started</div>
        <h2 className="cta-h">Ready to see <span className="a">Tempo HR?</span></h2>
        <p className="cta-p">Request a personalized demo. We&apos;ll show you every module with your company&apos;s data.</p>
        <div className="cta-btns">
          <a href="/demo-request" className="btn btn-orange">Request a Demo</a>
          <a href="/contact" className="btn btn-ghost">Contact Sales</a>
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
