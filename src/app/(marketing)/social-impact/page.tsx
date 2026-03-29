import '../landing.css'
import { LandingNav } from '@/components/marketing/landing-interactions'

const commitments = [
  { title: 'Affordable access', desc: 'Pricing tiers designed for emerging market companies.' },
  { title: 'Open API', desc: 'Full API access for ecosystem development and integrations.' },
  { title: 'Local compliance', desc: 'Statutory engines built with local tax authority standards.' },
  { title: 'Social enterprises', desc: 'Dedicated support and pricing for mission-driven organizations.' },
]

export default function SocialImpactPage() {
  return (
    <>
      <LandingNav />

      {/* HERO */}
      <section className="hero-center" style={{ minHeight: 'auto', paddingTop: 140, paddingBottom: 80 }}>
        <div className="hero-content" style={{ maxWidth: 700 }}>
          <div className="eyebrow"><span className="eyebrow-line" />Social Impact</div>
          <h1 className="hero-h1" style={{ fontSize: 'clamp(36px, 5vw, 64px)' }}>
            Technology that creates<br /><em>opportunity.</em>
          </h1>
          <p className="hero-p">
            We believe workforce software should make work better for everyone &mdash; not just enterprise buyers.
          </p>
        </div>
      </section>

      {/* AFRICA-FIRST */}
      <section className="sec sec-alt">
        <div className="ey">Africa-First Technology</div>
        <h2 className="sh">We started <span className="a">here.</span></h2>
        <p className="sp" style={{ maxWidth: 560 }}>
          Most workforce platforms treat Africa as an afterthought. We started here. Ghana PAYE, Nigeria PAYE,
          Kenya P9A &mdash; our payroll runs on the same statutory engines used by local tax authorities.
        </p>
      </section>

      {/* DIGITAL INCLUSION */}
      <section className="sec">
        <div className="ey">Digital Inclusion</div>
        <h2 className="sh">Same platform.<br /><span className="a">Every company.</span></h2>
        <p className="sp" style={{ maxWidth: 560 }}>
          Every company on Tempo gets access to the same AI, the same security, and the same integrations &mdash;
          whether they have 10 employees or 10,000.
        </p>
      </section>

      {/* COMMITMENTS */}
      <section className="sec sec-dark">
        <div className="ey" style={{ justifyContent: 'center' }}>Our Commitments</div>
        <h2 className="sh" style={{ textAlign: 'center', margin: '0 auto 48px' }}>
          What we&apos;re <span className="a">building toward.</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20, maxWidth: 900, margin: '0 auto' }}>
          {commitments.map(c => (
            <div key={c.title} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 28 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{c.title}</h3>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-sec">
        <div className="cta-ey">Get involved</div>
        <h2 className="cta-h">Partner<br />with <span className="a">us.</span></h2>
        <p className="cta-p">We&apos;re looking for organizations that share our mission to make work better for everyone.</p>
        <div className="cta-btns">
          <a href="/contact" className="btn btn-orange">Partner With Us</a>
          <a href="/about" className="btn btn-ghost">Learn More</a>
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
