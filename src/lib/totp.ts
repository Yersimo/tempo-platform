// TOTP (RFC 6238) implementation using Web Crypto API
// Works in Edge Runtime - no Node.js dependencies

const DIGITS = 6
const PERIOD = 30 // seconds
const ALGORITHM = 'SHA-1'

// Generate a random base32 secret
export function generateSecret(): string {
  const bytes = new Uint8Array(20)
  crypto.getRandomValues(bytes)
  return base32Encode(bytes)
}

// Generate TOTP code for current time
export async function generateTOTP(secret: string, timeOffset = 0): Promise<string> {
  const time = Math.floor((Date.now() / 1000 + timeOffset) / PERIOD)
  return generateHOTP(secret, time)
}

// Verify a TOTP code (checks current + previous + next window)
export async function verifyTOTP(secret: string, code: string, window = 1): Promise<boolean> {
  for (let i = -window; i <= window; i++) {
    const expected = await generateTOTP(secret, i * PERIOD)
    if (timingSafeEqual(code, expected)) return true
  }
  return false
}

// Generate HOTP (HMAC-based OTP)
async function generateHOTP(secret: string, counter: number): Promise<string> {
  const secretBytes = base32Decode(secret)

  // Convert counter to 8-byte big-endian
  const counterBytes = new Uint8Array(8)
  let temp = counter
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = temp & 0xff
    temp = Math.floor(temp / 256)
  }

  // HMAC-SHA1
  const key = await crypto.subtle.importKey(
    'raw',
    secretBytes as unknown as ArrayBuffer,
    { name: 'HMAC', hash: { name: ALGORITHM } },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, counterBytes)
  const hash = new Uint8Array(signature)

  // Dynamic truncation
  const offset = hash[hash.length - 1] & 0x0f
  const binary =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff)

  const otp = binary % Math.pow(10, DIGITS)
  return otp.toString().padStart(DIGITS, '0')
}

// Generate backup codes (8 codes, 8 chars each)
export function generateBackupCodes(): string[] {
  const codes: string[] = []
  for (let i = 0; i < 8; i++) {
    const bytes = new Uint8Array(4)
    crypto.getRandomValues(bytes)
    codes.push(Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(''))
  }
  return codes
}

// Generate otpauth:// URI for QR code
export function generateOTPAuthURI(secret: string, email: string, issuer = 'Tempo'): string {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=${DIGITS}&period=${PERIOD}`
}

// Timing-safe string comparison
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

// Base32 encoding/decoding
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

function base32Encode(data: Uint8Array): string {
  let result = ''
  let bits = 0
  let value = 0

  for (const byte of data) {
    value = (value << 8) | byte
    bits += 8

    while (bits >= 5) {
      result += BASE32_CHARS[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }

  if (bits > 0) {
    result += BASE32_CHARS[(value << (5 - bits)) & 31]
  }

  return result
}

function base32Decode(encoded: string): Uint8Array {
  const cleaned = encoded.replace(/[=\s]/g, '').toUpperCase()
  const bytes: number[] = []
  let bits = 0
  let value = 0

  for (const char of cleaned) {
    const idx = BASE32_CHARS.indexOf(char)
    if (idx === -1) continue

    value = (value << 5) | idx
    bits += 5

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }

  return new Uint8Array(bytes)
}
