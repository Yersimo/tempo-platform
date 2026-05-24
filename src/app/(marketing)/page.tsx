import './landing.css'

export default function LandingPage() {
  return (
    <main className="splash" aria-label="Tempo">
      <a href="/" className="splash-logo tempo-wordmark" aria-label="Tempo home">
        tempo<span className="tempo-beat">.</span>
      </a>

      <div className="splash-center">
        <div className="splash-cta-group" role="group" aria-label="Start here">
          <span className="splash-cta-default" aria-hidden="true">Start here</span>
          <a href="/login" className="splash-cta-action splash-cta-action-left">
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
