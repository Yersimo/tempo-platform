import '../landing.css'
import { LandingNav } from '@/components/marketing/landing-interactions'

type CellValue = string | { text: string; color: string }

const comparisonHeaders = ['Feature', 'Tempo', 'Rippling', 'Workday', 'BambooHR', 'Deel', 'SAP SF']

const comparisonRows: { feature: string; values: CellValue[] }[] = [
  { feature: 'Modules', values: ['50+', '30+', '40+', '12', '5', '25+'] },
  { feature: 'AI Assistant', values: [
    { text: 'Yes', color: '#16a34a' },
    { text: '\u2014', color: '#a0a0ad' },
    { text: 'Yes (Sana)', color: '#16a34a' },
    { text: '\u2014', color: '#a0a0ad' },
    { text: '\u2014', color: '#a0a0ad' },
    { text: '\u2014', color: '#a0a0ad' },
  ]},
  { feature: 'Africa Payroll', values: [
    { text: 'Deep', color: '#16a34a' },
    { text: 'Basic', color: '#d97706' },
    { text: 'Basic', color: '#d97706' },
    { text: '\u2014', color: '#a0a0ad' },
    { text: 'EOR', color: '#16a34a' },
    { text: 'Basic', color: '#d97706' },
  ]},
  { feature: 'India/Brazil Statutory', values: [
    { text: 'Full', color: '#16a34a' },
    { text: 'Full', color: '#16a34a' },
    { text: 'Full', color: '#16a34a' },
    { text: '\u2014', color: '#a0a0ad' },
    { text: 'EOR', color: '#16a34a' },
    { text: 'Full', color: '#16a34a' },
  ]},
  { feature: 'Bank Reconciliation', values: [
    { text: 'Yes', color: '#16a34a' },
    { text: '\u2014', color: '#a0a0ad' },
    { text: '\u2014', color: '#a0a0ad' },
    { text: '\u2014', color: '#a0a0ad' },
    { text: '\u2014', color: '#a0a0ad' },
    { text: 'Partial', color: '#d97706' },
  ]},
  { feature: 'Multi-Entity Consolidation', values: [
    { text: 'Yes', color: '#16a34a' },
    { text: '\u2014', color: '#a0a0ad' },
    { text: 'Yes', color: '#16a34a' },
    { text: '\u2014', color: '#a0a0ad' },
    { text: '\u2014', color: '#a0a0ad' },
    { text: 'Yes', color: '#16a34a' },
  ]},
  { feature: 'Event Cascade (visible)', values: [
    { text: 'Yes', color: '#16a34a' },
    { text: '\u2014', color: '#a0a0ad' },
    { text: '\u2014', color: '#a0a0ad' },
    { text: '\u2014', color: '#a0a0ad' },
    { text: '\u2014', color: '#a0a0ad' },
    { text: '\u2014', color: '#a0a0ad' },
  ]},
  { feature: 'Knowledge Base AI', values: [
    { text: 'Yes', color: '#16a34a' },
    { text: '\u2014', color: '#a0a0ad' },
    { text: 'Yes (Sana)', color: '#16a34a' },
    { text: '\u2014', color: '#a0a0ad' },
    { text: '\u2014', color: '#a0a0ad' },
    { text: '\u2014', color: '#a0a0ad' },
  ]},
  { feature: 'Starting Price', values: ['Contact', 'Contact', '$$$$$', '$$$', '$49/mo', '$$$$$'] },
  { feature: 'Implementation', values: [
    { text: 'Days', color: '#16a34a' },
    { text: 'Weeks', color: '#d97706' },
    { text: 'Months', color: '#dc2626' },
    { text: 'Days', color: '#16a34a' },
    { text: 'Hours', color: '#16a34a' },
    { text: 'Months', color: '#dc2626' },
  ]},
]

const reasons = [
  {
    title: 'One data model, not 15 acquisitions',
    desc: 'Workday and SAP grew by acquiring companies. Their data is siloed. Tempo was built as one system from Day 1.',
  },
  {
    title: 'Africa-first, not Africa-afterthought',
    desc: 'Ghana PAYE + SSNIT, Nigeria PAYE + NHF, Kenya PAYE + NHIF. Real statutory compliance, not just tax brackets.',
  },
  {
    title: 'AI that works on YOUR data',
    desc: 'Tempo AI answers questions from your real employee data. Upload your policies and employees get instant answers. No external API calls. Your data stays in your tenant.',
  },
  {
    title: 'See the integration, don\'t just trust the brochure',
    desc: 'Our event cascade shows downstream actions in real-time. Hire someone \u2014 watch 9 systems update automatically. No other platform makes integration visible.',
  },
  {
    title: 'Enterprise depth at mid-market speed',
    desc: 'SOC 2 framework, SAML SSO, SCIM provisioning, multi-entity consolidation. But you can be live in days, not months.',
  },
]

function getCellText(val: CellValue): string {
  return typeof val === 'string' ? val : val.text
}
function getCellColor(val: CellValue): string | undefined {
  return typeof val === 'string' ? undefined : val.color
}

export default function WhyTempoPage() {
  return (
    <>
      <LandingNav />

      {/* HERO */}
      <section className="hero" style={{ minHeight: 'auto', paddingTop: 140, paddingBottom: 80 }}>
        <div className="hero-content" style={{ maxWidth: 700 }}>
          <div className="eyebrow"><span className="eyebrow-line" />WHY TEMPO</div>
          <h1 className="hero-h1" style={{ fontSize: 'clamp(36px, 5vw, 64px)' }}>
            Why companies choose Tempo<br />over the <em>alternatives.</em>
          </h1>
          <div className="hero-btns">
            <a href="/demo-request" className="btn btn-orange">Request a Demo</a>
            <a href="/contact" className="btn btn-ghost">Contact Sales</a>
          </div>
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section className="sec sec-alt">
        <div className="ey">Comparison</div>
        <h2 className="sh">Feature-by-feature. <span className="a">No spin.</span></h2>
        <div style={{ overflowX: 'auto', marginTop: 40 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 800 }}>
            <thead>
              <tr>
                {comparisonHeaders.map((h, i) => (
                  <th key={h} style={{
                    textAlign: 'left',
                    padding: '14px 16px',
                    borderBottom: '2px solid var(--border)',
                    fontSize: 13,
                    fontWeight: 600,
                    color: i === 1 ? 'var(--orange)' : 'var(--black)',
                    background: i === 1 ? '#fff7ed' : 'transparent',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map(row => (
                <tr key={row.feature}>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 500, color: 'var(--black)' }}>
                    {row.feature}
                  </td>
                  {row.values.map((val, i) => (
                    <td key={i} style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--border)',
                      color: getCellColor(val) || 'var(--ink2)',
                      fontWeight: i === 0 ? 600 : 400,
                      background: i === 0 ? '#fff7ed' : 'transparent',
                    }}>
                      {getCellText(val)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ marginTop: 24, fontSize: 12, color: 'var(--ink2)', textAlign: 'center', maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
          Feature comparisons based on publicly available information as of March 2026. Competitor features may have changed. Contact us for the most current comparison.
        </p>
      </section>

      {/* 5 REASONS */}
      <section className="sec sec-dark">
        <div className="ey" style={{ justifyContent: 'center' }}>5 Reasons</div>
        <h2 className="sh" style={{ textAlign: 'center', margin: '0 auto 48px' }}>
          Why Tempo <span className="a">wins.</span>
        </h2>
        <div style={{ display: 'grid', gap: 32, maxWidth: 700, margin: '0 auto' }}>
          {reasons.map((r, i) => (
            <div key={r.title} style={{ display: 'grid', gridTemplateColumns: '48px 1fr', gap: 20, alignItems: 'start' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: 'rgba(234,88,12,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, fontWeight: 700, color: '#fb923c', flexShrink: 0,
              }}>{i + 1}</div>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 600, color: '#fff', marginBottom: 8 }}>
                  &ldquo;{r.title}&rdquo;
                </h3>
                <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>
                  {r.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-sec">
        <div className="cta-ey">Get started</div>
        <h2 className="cta-h">See why teams switch <span className="a">to Tempo.</span></h2>
        <p className="cta-p">Request a personalized demo. We&apos;ll show you side-by-side how Tempo compares.</p>
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
