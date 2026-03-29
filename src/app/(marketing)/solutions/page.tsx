import '../landing.css'
import { LandingNav } from '@/components/marketing/landing-interactions'

const solutions = [
  {
    title: 'HR Platform',
    desc: '15 modules from hire to retire. People, recruiting, performance, learning, compensation, and more.',
    href: '/products/hr',
    modules: 15,
  },
  {
    title: 'Global Payroll',
    desc: '101 countries, 7 payment formats, deep statutory compliance for Africa, India, Brazil, and beyond.',
    href: '/products/payroll',
    modules: 101,
    unit: 'countries',
  },
  {
    title: 'Finance Suite',
    desc: 'Double-entry GL, bank reconciliation, invoicing, expenses, consolidation, and board reports.',
    href: '/products/finance',
    modules: 14,
  },
  {
    title: 'IT & Identity',
    desc: 'SSO, SCIM provisioning, device management, Shadow IT detection, and auto-provisioning.',
    href: '/products/it',
    modules: 8,
  },
  {
    title: 'Tempo AI',
    desc: 'Ask anything about your workforce. AI trained on your real employee data, policies, and org structure.',
    href: '/products/ai',
    modules: 208,
    unit: 'query patterns',
  },
]

const industries = [
  { name: 'Technology', desc: 'Equity grants, skills tracking, internal mobility, and engineering leveling.' },
  { name: 'Financial Services', desc: 'Compliance-first with audit trails, segregation of duties, and regulatory reporting.' },
  { name: 'Healthcare', desc: 'Credential tracking, shift scheduling, compliance training, and licensure management.' },
  { name: 'Manufacturing', desc: 'Shift-based payroll, safety training, skills certification, and workforce planning.' },
  { name: 'Professional Services', desc: 'Project-based billing, utilization tracking, contractor management, and time capture.' },
  { name: 'Non-Profit', desc: 'Grant-based budgeting, volunteer management, donor reporting, and fund accounting.' },
]

export default function SolutionsPage() {
  return (
    <>
      <LandingNav />

      {/* HERO */}
      <section className="hero-center" style={{ minHeight: 'auto', paddingTop: 140, paddingBottom: 80 }}>
        <div className="hero-content" style={{ maxWidth: 700 }}>
          <div className="eyebrow"><span className="eyebrow-line" />SOLUTIONS</div>
          <h1 className="hero-h1" style={{ fontSize: 'clamp(36px, 5vw, 64px)' }}>
            One platform for<br /><em>every team.</em>
          </h1>
          <p className="hero-p">
            HR, payroll, finance, IT, and AI &mdash; unified in a single data layer. Choose your starting point.
          </p>
          <div className="hero-btns">
            <a href="/demo-request" className="btn btn-orange">Request a Demo</a>
            <a href="/contact" className="btn btn-ghost">Contact Sales</a>
          </div>
        </div>
      </section>

      {/* PRODUCT SOLUTIONS */}
      <section className="sec sec-alt">
        <div className="ey">Products</div>
        <h2 className="sh">Five pillars. <span className="a">One platform.</span></h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20, marginTop: 40, maxWidth: 1000 }}>
          {solutions.map(s => (
            <a key={s.title} href={s.href} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 18, padding: 32, textDecoration: 'none', display: 'block', transition: 'border-color 0.2s' }}>
              <div style={{ fontSize: 32, fontWeight: 300, color: 'var(--orange)', letterSpacing: '-0.02em', marginBottom: 8 }}>
                {s.modules}{s.unit ? '' : '+'}{' '}
                <span style={{ fontSize: 13, color: 'var(--ink2)', fontWeight: 400 }}>{s.unit || 'modules'}</span>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--black)', marginBottom: 8 }}>{s.title}</h3>
              <p style={{ fontSize: 14, color: 'var(--ink2)', lineHeight: 1.7 }}>{s.desc}</p>
            </a>
          ))}
        </div>
      </section>

      {/* INDUSTRY SOLUTIONS */}
      <section className="sec">
        <div className="ey">By Industry</div>
        <h2 className="sh">Built for your <span className="a">industry.</span></h2>
        <p className="sp" style={{ maxWidth: 500 }}>
          Tempo adapts to any industry with configurable workflows, compliance rules, and reporting templates.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20, marginTop: 40, maxWidth: 1000 }}>
          {industries.map(ind => (
            <div key={ind.name} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 32 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--black)', marginBottom: 8 }}>{ind.name}</h3>
              <p style={{ fontSize: 14, color: 'var(--ink2)', lineHeight: 1.7 }}>{ind.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-sec">
        <div className="cta-ey">Get started</div>
        <h2 className="cta-h">Find the right solution <span className="a">for your team.</span></h2>
        <p className="cta-p">Request a demo and we&apos;ll tailor the walkthrough to your industry and team size.</p>
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
