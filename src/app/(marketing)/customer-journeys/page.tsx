import '../landing.css'
import { LandingNav } from '@/components/marketing/landing-interactions'

const journeys = [
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
  return (
    <>
      <LandingNav />

      {/* HERO */}
      <section className="hero-center" style={{ minHeight: 'auto', paddingTop: 140, paddingBottom: 80 }}>
        <div className="hero-content" style={{ maxWidth: 700 }}>
          <div className="eyebrow"><span className="eyebrow-line" />CUSTOMER JOURNEYS</div>
          <h1 className="hero-h1" style={{ fontSize: 'clamp(36px, 5vw, 64px)' }}>
            6 journeys that prove<br /><em>integration.</em>
          </h1>
          <p className="hero-p">
            Each journey traces one business event through every module it touches &mdash; automatically, without manual intervention.
          </p>
          <div className="hero-btns">
            <a href="/demo-request" className="btn btn-orange">Request a Demo</a>
            <a href="/contact" className="btn btn-ghost">Contact Sales</a>
          </div>
        </div>
      </section>

      {/* JOURNEY CARDS */}
      <section className="sec sec-alt">
        <div className="ey">End-to-End Journeys</div>
        <h2 className="sh">One event. Many modules.<br /><span className="a">Zero manual steps.</span></h2>
        <div style={{ display: 'grid', gap: 24, marginTop: 40, maxWidth: 900 }}>
          {journeys.map((j, idx) => (
            <div key={j.title} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 18, padding: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: '#E0F2F1',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 700, color: '#004D40', flexShrink: 0,
                }}>{idx + 1}</div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--black)' }}>{j.title}</h3>
                    {j.badge && (
                      <span style={{
                        fontSize: 11, fontWeight: 600, color: '#004D40',
                        background: '#E0F2F1', padding: '3px 10px',
                        borderRadius: 100, textTransform: 'uppercase', letterSpacing: '0.05em',
                      }}>{j.badge}</span>
                    )}
                  </div>
                  <p style={{ fontSize: 14, color: 'var(--ink2)', marginTop: 4 }}>{j.summary}</p>
                </div>
              </div>
              <div style={{ display: 'grid', gap: 0, paddingLeft: 56 }}>
                {j.steps.map((step, si) => (
                  <div key={si} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: 6,
                        background: '#E0F2F1', border: '1px solid rgba(0,77,64,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 600, color: '#004D40',
                      }}>{si + 1}</div>
                      {si < j.steps.length - 1 && (
                        <div style={{ width: 1, height: 16, background: 'rgba(234,88,12,0.12)' }} />
                      )}
                    </div>
                    <div style={{ paddingTop: 2, paddingBottom: si < j.steps.length - 1 ? 4 : 0, fontSize: 14, color: 'var(--ink2)', lineHeight: 1.5 }}>
                      {step}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-sec">
        <div className="cta-ey">Get started</div>
        <h2 className="cta-h">Ready to see these <span className="a">journeys live?</span></h2>
        <p className="cta-p">Book a demo and we&apos;ll walk you through any journey with your company&apos;s data.</p>
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
