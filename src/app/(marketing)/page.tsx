import './landing.css'
import { Logo } from '@/components/brand/logo'

export default function LandingPage() {
  return (
    <main className="splash" aria-label="Tempo">
      <a href="/" className="splash-logo" aria-label="Tempo home">
        <Logo variant="default" size={28} />
      </a>

      <div className="splash-center">
        <div className="splash-copy" aria-label="Tempo platform summary">
          <p className="splash-kicker">Enterprise workforce operations</p>
          <h1>People, payroll, finance, IT, and workforce operations in one Tempo platform.</h1>
          <p>
            Built for growing companies that need credible HR, payroll, expenses, learning,
            performance, devices, access, and approvals to move together without stitching tools.
            Enterprise security, privacy, compliance, audit controls, and clear implementation paths are built into the same operating layer.
          </p>
        </div>

        <div className="splash-cta-group" role="group" aria-label="Start here">
          <span className="splash-cta-default" aria-hidden="true">Start here</span>
          <a href="/demo-request" className="splash-cta-action splash-cta-action-left">
            <span>Request demo</span>
          </a>
          <span className="splash-cta-divider" aria-hidden="true" />
          <a href="/login" className="splash-cta-action">
            <span>Sign in</span>
          </a>
          <span className="splash-cta-divider" aria-hidden="true" />
          <a href="/learn" className="splash-cta-action splash-cta-action-right">
            <span>Learn more</span>
          </a>
        </div>
      </div>
    </main>
  )
}
