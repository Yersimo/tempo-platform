// ─── Have I Been Pwned (HIBP) Breach Detection ─────────────────────────────
// Uses k-anonymity: only the first 5 characters of the SHA-1 hash are sent
// to the API, so the full password is never transmitted.

export async function checkPasswordBreach(password: string): Promise<{ breached: boolean; count: number }> {
  // Use Web Crypto API (works in Edge Runtime) to compute SHA-1
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-1', data)
  const hashArray = new Uint8Array(hashBuffer)
  const sha1 = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase()

  const prefix = sha1.substring(0, 5)
  const suffix = sha1.substring(5)

  try {
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'User-Agent': 'Tempo-Platform-Security' },
    })

    if (!response.ok) return { breached: false, count: 0 } // Fail open

    const text = await response.text()
    const lines = text.split('\n')

    for (const line of lines) {
      const [hashSuffix, countStr] = line.split(':')
      if (hashSuffix.trim() === suffix) {
        return { breached: true, count: parseInt(countStr.trim(), 10) }
      }
    }

    return { breached: false, count: 0 }
  } catch {
    return { breached: false, count: 0 } // Fail open if API unreachable
  }
}
