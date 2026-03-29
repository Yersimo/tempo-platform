import '../../landing.css'
import { LandingNav } from '@/components/marketing/landing-interactions'

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
  return (
    <>
      <LandingNav />

      {/* HERO */}
      <section className="hero" style={{ minHeight: 'auto', paddingTop: 140, paddingBottom: 80 }}>
        <div className="hero-content" style={{ maxWidth: 700 }}>
          <div className="eyebrow"><span className="eyebrow-line" />GLOBAL PAYROLL</div>
          <h1 className="hero-h1" style={{ fontSize: 'clamp(36px, 5vw, 64px)' }}>
            Payroll that actually<br /><em>runs payroll.</em>
          </h1>
          <p className="hero-p">
            101 countries. 7 payment formats. Real statutory compliance &mdash; not just tax brackets.
          </p>
          <div className="hero-btns">
            <a href="/demo-request" className="btn btn-orange">Request a Demo</a>
            <a href="/contact" className="btn btn-ghost">Contact Sales</a>
          </div>
        </div>
      </section>

      {/* COUNTRY COMPLIANCE */}
      <section className="sec sec-alt">
        <div className="ey">Country Compliance</div>
        <h2 className="sh">Deep statutory compliance.<br /><span className="a">Not surface-level tax tables.</span></h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 20, marginTop: 40, maxWidth: 1000 }}>
          {countries.map(c => (
            <div key={c.name} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 18, padding: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <span style={{ fontSize: 28 }}>{c.flag}</span>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--black)', marginBottom: 0 }}>{c.name}</h3>
              </div>
              <p style={{ fontSize: 14, color: 'var(--ink2)', lineHeight: 1.7 }}>{c.details}</p>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <span style={{ fontSize: 15, color: 'var(--orange)', fontWeight: 600 }}>+ 95 more countries</span>
        </div>
      </section>

      {/* PAYMENT FORMATS */}
      <section className="sec">
        <div className="ey">Payment Formats</div>
        <h2 className="sh">Generate the right file for <span className="a">every bank.</span></h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center', marginTop: 40 }}>
          {paymentFormats.map(f => (
            <div key={f.name} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 28px', textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--black)' }}>{f.name}</div>
              <div style={{ fontSize: 13, color: 'var(--ink2)', marginTop: 4 }}>{f.region}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PAYROLL AUTOMATION */}
      <section className="sec sec-dark">
        <div className="ey" style={{ justifyContent: 'center' }}>Payroll Automation</div>
        <h2 className="sh" style={{ textAlign: 'center', margin: '0 auto 16px' }}>
          One click. Seven downstream <span className="a">actions.</span>
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 48, maxWidth: 900, margin: '48px auto 0' }}>
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
                <svg style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.15)', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5l7 7-7 7" /></svg>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* AUTO-JE INTEGRATION */}
      <section className="sec sec-alt">
        <div className="ey">Auto-JE Integration</div>
        <h2 className="sh">Payroll posts to your general ledger. <span className="a">Automatically.</span></h2>
        <div style={{
          maxWidth: 560,
          margin: '40px auto 0',
          background: '#0f1117',
          borderRadius: 18,
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
      </section>

      {/* CTA */}
      <section className="cta-sec">
        <div className="cta-ey">Get started</div>
        <h2 className="cta-h">Ready to run <span className="a">real payroll?</span></h2>
        <p className="cta-p">Request a demo and we&apos;ll show you payroll in your country with your statutory rules.</p>
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
