import '../../landing.css'
import { LandingNav } from '@/components/marketing/landing-interactions'

const modules = [
  { name: 'Identity', desc: 'SSO, SAML, SCIM provisioning. One login for every app, synced with your employee record.' },
  { name: 'Devices', desc: 'Track laptops, phones, and peripherals. Auto-assign on Day 1, reclaim on the last day.' },
  { name: 'Apps & SaaS', desc: 'See every SaaS subscription, license count, and spend. Auto-provision and deprovision.' },
  { name: 'Password Manager', desc: 'Shared vaults, role-based access, and automatic rotation. Built into the platform.' },
  { name: 'Automation', desc: 'Provision access on Day 1. Revoke it on the last day. Zero manual steps.' },
]

export default function ITProductPage() {
  return (
    <>
      <LandingNav />

      {/* HERO */}
      <section className="hero" style={{ minHeight: 'auto', paddingTop: 140, paddingBottom: 80 }}>
        <div className="hero-content" style={{ maxWidth: 700 }}>
          <div className="eyebrow"><span className="eyebrow-line" />IT Management</div>
          <h1 className="hero-h1" style={{ fontSize: 'clamp(36px, 5vw, 64px)' }}>
            IT management<br />built into <em>HR.</em>
          </h1>
          <p className="hero-p">
            Provision access on Day 1. Revoke it on the last day. Automatically.
          </p>
          <div className="hero-btns">
            <a href="/demo-request" className="btn btn-orange">Request a Demo</a>
            <a href="/products/platform" className="btn btn-ghost">See Platform</a>
          </div>
        </div>
      </section>

      {/* MODULES */}
      <section className="sec sec-alt">
        <div className="ey">Modules</div>
        <h2 className="sh">Access, devices,<br />and apps. <span className="a">Unified.</span></h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20, marginTop: 40, maxWidth: 900 }}>
          {modules.map(m => (
            <div key={m.name} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 14, padding: 28 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--black)', marginBottom: 8 }}>{m.name}</h3>
              <p style={{ fontSize: 14, color: 'var(--ink2)', lineHeight: 1.7 }}>{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* KEY BENEFIT */}
      <section className="sec sec-dark">
        <div className="ey" style={{ justifyContent: 'center' }}>Why It Matters</div>
        <h2 className="sh" style={{ textAlign: 'center', margin: '0 auto 20px' }}>
          IT + HR = <span className="a">zero gaps.</span>
        </h2>
        <p className="sp" style={{ textAlign: 'center', margin: '0 auto', color: 'rgba(255,255,255,0.5)', maxWidth: 480 }}>
          When IT lives inside HR, onboarding and offboarding become fully automated.
          No tickets. No delays. No orphaned accounts.
        </p>
      </section>

      {/* CTA */}
      <section className="cta-sec">
        <div className="cta-ey">Get started</div>
        <h2 className="cta-h">IT that runs<br /><span className="a">itself.</span></h2>
        <p className="cta-p">See how Tempo automates identity, devices, and apps from hire to retire.</p>
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
