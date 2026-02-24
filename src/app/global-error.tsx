'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', background: '#f5f5f7', margin: 0 }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ textAlign: 'center', maxWidth: 400 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h1 style={{ fontSize: 24, fontWeight: 600, color: '#111', marginBottom: 8 }}>
              Critical Error
            </h1>
            <p style={{ fontSize: 14, color: '#666', marginBottom: 24, lineHeight: 1.6 }}>
              Something went seriously wrong. Please try refreshing the page.
            </p>
            {error.digest && (
              <p style={{ fontSize: 11, color: '#999', fontFamily: 'monospace', marginBottom: 16 }}>
                Error ID: {error.digest}
              </p>
            )}
            <button
              onClick={reset}
              style={{
                padding: '10px 24px',
                background: '#ea580c',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
