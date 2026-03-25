import '../landing.css'
import { LandingNav } from '@/components/marketing/landing-interactions'

const pressReleases = [
  { title: 'Tempo Launches AI Assistant for Workforce Management', date: 'March 2026', tag: 'Product' },
  { title: 'Tempo Expands Payroll Coverage to 101 Countries', date: 'February 2026', tag: 'Expansion' },
  { title: 'Tempo Achieves SOC 2 Type II Framework Compliance', date: 'January 2026', tag: 'Security' },
]

export default function NewsroomPage() {
  return (
    <>
      <LandingNav />

      {/* HERO */}
      <section className="hero" style={{ minHeight: 'auto', paddingTop: 140, paddingBottom: 80 }}>
        <div className="hero-content" style={{ maxWidth: 700 }}>
          <div className="eyebrow"><span className="eyebrow-line" />Newsroom</div>
          <h1 className="hero-h1" style={{ fontSize: 'clamp(36px, 5vw, 64px)' }}>
            Latest from<br /><em>Tempo.</em>
          </h1>
          <p className="hero-p">
            Press releases, product updates, and company news.
          </p>
        </div>
      </section>

      {/* PRESS RELEASES */}
      <section className="sec sec-alt">
        <div className="ey">Press Releases</div>
        <h2 className="sh">Recent <span className="a">announcements.</span></h2>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 16, marginTop: 40, maxWidth: 700 }}>
          {pressReleases.map(pr => (
            <div key={pr.title} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 14, padding: '24px 28px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
              <div>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--orange)', marginBottom: 6, display: 'block' }}>{pr.tag}</span>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--black)', lineHeight: 1.4 }}>{pr.title}</h3>
              </div>
              <span style={{ fontSize: 13, color: 'var(--muted)', whiteSpace: 'nowrap' as const, flexShrink: 0 }}>{pr.date}</span>
            </div>
          ))}
        </div>
      </section>

      {/* MEDIA CONTACT */}
      <section className="sec">
        <div className="ey">Media Contact</div>
        <h2 className="sh">Get in <span className="a">touch.</span></h2>
        <p className="sp">
          For press inquiries: <a href="mailto:press@theworktempo.com" style={{ color: 'var(--orange)', fontWeight: 600, textDecoration: 'none' }}>press@theworktempo.com</a>
        </p>
      </section>

      {/* BRAND ASSETS */}
      <section className="sec sec-alt">
        <div className="ey">Brand Assets</div>
        <h2 className="sh">Logo &amp; <span className="a">guidelines.</span></h2>
        <p className="sp">
          Download our logo, brand guidelines, and media kit for editorial use.
        </p>
        <div style={{ marginTop: 28 }}>
          <a href="/contact" className="btn btn-dark">Request Brand Kit</a>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-sec">
        <div className="cta-ey">Stay updated</div>
        <h2 className="cta-h">Follow <span className="a">Tempo.</span></h2>
        <p className="cta-p">Subscribe to our newsletter for the latest product updates and company news.</p>
        <div className="cta-btns">
          <a href="/contact" className="btn btn-orange">Contact Press Team</a>
          <a href="/about" className="btn btn-ghost">About Tempo</a>
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
