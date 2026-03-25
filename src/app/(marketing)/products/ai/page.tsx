import '../../landing.css'
import { LandingNav } from '@/components/marketing/landing-interactions'

const capabilities = [
  {
    title: 'Answer questions from your real data',
    example: '"How many people are on leave?"',
    result: 'Instant answer from live employee records.',
  },
  {
    title: 'Take actions via natural language',
    example: '"Create a job posting for Senior Analyst"',
    result: 'Done. Posting created with suggested description.',
  },
  {
    title: 'Run what-if scenarios',
    example: '"What if we hire 5 engineers?"',
    result: 'Cost projection with benefits, taxes, and runway impact.',
  },
  {
    title: 'Answer policy questions',
    example: '"What\'s our maternity leave policy?"',
    result: 'Instant answer from your uploaded knowledge base.',
  },
]

export default function AIProductPage() {
  return (
    <>
      <LandingNav />

      {/* HERO */}
      <section className="hero" style={{ minHeight: 'auto', paddingTop: 140, paddingBottom: 80 }}>
        <div className="hero-content" style={{ maxWidth: 700 }}>
          <div className="eyebrow"><span className="eyebrow-line" />Tempo AI</div>
          <h1 className="hero-h1" style={{ fontSize: 'clamp(36px, 5vw, 64px)' }}>
            Meet <em>Tempo AI.</em>
          </h1>
          <p className="hero-p">
            Ask anything. Do anything. From anywhere.
          </p>
          <div className="hero-btns">
            <a href="/demo-request" className="btn btn-orange">Try Tempo AI</a>
            <a href="/products/platform" className="btn btn-ghost">See Platform</a>
          </div>
        </div>
      </section>

      {/* CAPABILITIES */}
      <section className="sec sec-alt">
        <div className="ey">What Tempo AI Can Do</div>
        <h2 className="sh">Your workforce,<br /><span className="a">answerable.</span></h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20, marginTop: 40, maxWidth: 900 }}>
          {capabilities.map(c => (
            <div key={c.title} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 14, padding: 28 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--black)', marginBottom: 14 }}>{c.title}</h3>
              <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '12px 16px', marginBottom: 12, fontFamily: 'monospace', fontSize: 13, color: 'var(--ink2)' }}>
                &gt; {c.example}
              </div>
              <p style={{ fontSize: 14, color: 'var(--orange)', fontWeight: 600 }}>{c.result}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 208 QUERY PATTERNS */}
      <section className="sec sec-dark">
        <div className="ey" style={{ justifyContent: 'center' }}>Query Intelligence</div>
        <h2 className="sh" style={{ textAlign: 'center', margin: '0 auto 20px' }}>
          <span className="a">208</span> query patterns.
        </h2>
        <p className="sp" style={{ textAlign: 'center', margin: '0 auto', color: 'rgba(255,255,255,0.5)', maxWidth: 480 }}>
          From &ldquo;my leave balance&rdquo; to &ldquo;what if Kwame leaves?&rdquo; &mdash;
          Tempo AI understands your workforce. Every query runs against your real data, not a generic model.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8, justifyContent: 'center', marginTop: 40, maxWidth: 700, margin: '40px auto 0' }}>
          {['Leave balance', 'Who reports to...', 'Headcount by dept', 'Comp ratio', 'Flight risk', 'Open roles', 'Cost projection', 'Policy lookup', 'Org chart', 'Turnover rate'].map(q => (
            <span key={q} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 16px', fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{q}</span>
          ))}
        </div>
      </section>

      {/* KNOWLEDGE BASE */}
      <section className="sec">
        <div className="ey">Company Knowledge Base</div>
        <h2 className="sh">Upload your policies.<br /><span className="a">Save 15 hours/week.</span></h2>
        <p className="sp" style={{ maxWidth: 520 }}>
          Upload your policies, procedures, and handbooks. Employees get instant answers. HR saves 15 hours per week on repetitive questions.
        </p>
      </section>

      {/* CTA */}
      <section className="cta-sec">
        <div className="cta-ey">Get started</div>
        <h2 className="cta-h">Try <span className="a">Tempo AI.</span></h2>
        <p className="cta-p">See how AI works with your real workforce data. Book a personalized demo.</p>
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
