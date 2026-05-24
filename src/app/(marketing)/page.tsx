import './landing.css'

export default function LandingPage() {
  return (
    <main className="splash" aria-label="Tempo">
      <a href="/" className="splash-logo tempo-wordmark" aria-label="Tempo home">
        tempo<span className="tempo-beat">.</span>
      </a>

      <div className="splash-center">
        <a href="/login" className="splash-cta">Start here</a>
      </div>
    </main>
  )
}
