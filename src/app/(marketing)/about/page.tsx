import '../landing.css'
import { LandingNav } from '@/components/marketing/landing-interactions'

export default function AboutPage() {
  return (
    <>
      <LandingNav />

      {/* HERO */}
      <section className="hero" style={{ minHeight: 'auto', paddingTop: 140, paddingBottom: 80 }}>
        <div className="hero-content" style={{ maxWidth: 700 }}>
          <div className="eyebrow"><span className="eyebrow-line" />About Tempo</div>
          <h1 className="hero-h1" style={{ fontSize: 'clamp(36px, 5vw, 64px)' }}>
            The company behind<br /><em>the platform.</em>
          </h1>
          <p className="hero-p">
            We started Tempo because we believed workforce software should be one system, not fifteen.
          </p>
        </div>
      </section>

      {/* OUR STORY */}
      <section className="sec sec-alt">
        <div className="ey">Our Story</div>
        <h2 className="sh">From frustration<br />to <span className="a">foundation.</span></h2>
        <p className="sp" style={{ maxWidth: 560 }}>
          Founded in 2024, Tempo was born from a simple observation: every company we worked with
          was paying for 8-12 HR tools that didn&apos;t talk to each other. Payroll didn&apos;t know about
          promotions. IT didn&apos;t know about offboarding. Finance was reconciling in spreadsheets.
        </p>
      </section>

      {/* OUR MISSION */}
      <section className="sec">
        <div className="ey">Our Mission</div>
        <h2 className="sh">One record.<br /><span className="a">Every system.</span></h2>
        <p className="sp" style={{ maxWidth: 560 }}>
          Build the unified workforce platform &mdash; where one employee record powers every module,
          one event cascades through every system, and one AI assistant understands your entire organization.
        </p>
      </section>

      {/* BY THE NUMBERS */}
      <section className="sec sec-dark">
        <div className="ey" style={{ justifyContent: 'center' }}>By the Numbers</div>
        <h2 className="sh" style={{ textAlign: 'center', margin: '0 auto 48px' }}>
          Built for <span className="a">scale.</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 32, maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          {[
            { val: '50+', label: 'Modules' },
            { val: '311', label: 'Database tables' },
            { val: '101', label: 'Countries with payroll' },
            { val: '53/53', label: 'Lifecycle tests pass' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 48, fontWeight: 300, color: 'var(--orange)', letterSpacing: '-0.02em' }}>{s.val}</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* OUR VALUES */}
      <section className="sec sec-alt">
        <div className="ey">Our Values</div>
        <h2 className="sh">What we <span className="a">stand for.</span></h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24, marginTop: 40, maxWidth: 900 }}>
          {[
            { title: 'Integration over features', desc: 'One connected system beats ten disconnected best-of-breed tools.' },
            { title: 'Africa-first, globally ready', desc: 'We build for the hardest compliance requirements first, then scale worldwide.' },
            { title: 'AI that works on your data', desc: 'No generic chatbots. Tempo AI answers from your real employee records.' },
            { title: 'Enterprise security from Day 1', desc: 'SOC 2, GDPR, ISO 27001 frameworks baked in from the start.' },
          ].map(v => (
            <div key={v.title} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 14, padding: 28 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--black)', marginBottom: 8 }}>{v.title}</h3>
              <p style={{ fontSize: 14, color: 'var(--ink2)', lineHeight: 1.7 }}>{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-sec">
        <div className="cta-ey">Join the team</div>
        <h2 className="cta-h">Build the future<br />of <span className="a">work.</span></h2>
        <p className="cta-p">Join us in building the platform that makes work better for everyone.</p>
        <div className="cta-btns">
          <a href="/careers" className="btn btn-orange">See Careers</a>
          <a href="/demo-request" className="btn btn-ghost">Request a Demo</a>
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
