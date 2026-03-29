import '../landing.css'
import { LandingNav } from '@/components/marketing/landing-interactions'

const departments = [
  {
    name: 'Engineering',
    roles: ['Full Stack Engineer', 'DevOps Engineer'],
  },
  {
    name: 'Product',
    roles: ['Product Manager', 'Product Designer'],
  },
  {
    name: 'Go-to-Market',
    roles: ['Account Executive', 'Customer Success'],
  },
  {
    name: 'Operations',
    roles: ['People Operations', 'Finance'],
  },
]

const perks = [
  { title: 'Equity', desc: 'Meaningful equity in a high-growth company.' },
  { title: 'Remote-first', desc: 'Work from anywhere. We hire globally.' },
  { title: 'Unlimited PTO', desc: 'Take the time you need. We trust you.' },
  { title: 'Learning budget', desc: 'Annual stipend for courses, conferences, and books.' },
]

export default function CareersPage() {
  return (
    <>
      <LandingNav />

      {/* HERO */}
      <section className="hero-center" style={{ minHeight: 'auto', paddingTop: 140, paddingBottom: 80 }}>
        <div className="hero-content" style={{ maxWidth: 700 }}>
          <div className="eyebrow"><span className="eyebrow-line" />Careers</div>
          <h1 className="hero-h1" style={{ fontSize: 'clamp(36px, 5vw, 64px)' }}>
            Build the future<br />of work. <em>With us.</em>
          </h1>
          <p className="hero-p">
            We&apos;re looking for people who think in systems, not silos.
          </p>
        </div>
      </section>

      {/* OPEN ROLES */}
      <section className="sec sec-alt">
        <div className="ey">Open Roles</div>
        <h2 className="sh">Every role <span className="a">matters.</span></h2>
        <p className="sp" style={{ maxWidth: 520 }}>
          We&apos;re a small team building a platform that competes with Workday. Every hire changes what we can do.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24, marginTop: 40, maxWidth: 900 }}>
          {departments.map(dept => (
            <div key={dept.name} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 14, padding: 28 }}>
              <h3 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--orange)', marginBottom: 16 }}>{dept.name}</h3>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
                {dept.roles.map(role => (
                  <div key={role} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg)', borderRadius: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{role}</span>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>Remote</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* WHAT WE OFFER */}
      <section className="sec">
        <div className="ey">What We Offer</div>
        <h2 className="sh">Benefits that <span className="a">matter.</span></h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20, marginTop: 40, maxWidth: 900 }}>
          {perks.map(p => (
            <div key={p.title} style={{ background: 'var(--bg)', borderRadius: 14, padding: 28 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--black)', marginBottom: 8 }}>{p.title}</h3>
              <p style={{ fontSize: 14, color: 'var(--ink2)', lineHeight: 1.7 }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-sec">
        <div className="cta-ey">Ready to apply?</div>
        <h2 className="cta-h">Let&apos;s build<br /><span className="a">together.</span></h2>
        <p className="cta-p">Send us your resume. We read every application.</p>
        <div className="cta-btns">
          <a href="mailto:careers@theworktempo.com" className="btn btn-orange">See Open Roles</a>
          <a href="/contact" className="btn btn-ghost">Contact Us</a>
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
