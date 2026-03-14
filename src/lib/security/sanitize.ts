/**
 * Input sanitization utilities for XSS prevention, email/URL validation,
 * and SQL injection defence (backup layer on top of parameterised queries).
 */

// ── HTML / XSS sanitisation ──────────────────────────────────────────────

/**
 * Strip HTML tags from a string to prevent XSS.
 * Also neutralises common XSS vectors embedded in attributes / event handlers.
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return ''

  return input
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove javascript: protocol patterns
    .replace(/javascript\s*:/gi, '')
    // Remove on* event handler attributes that might survive tag stripping
    .replace(/on\w+\s*=\s*(['"]?).*?\1/gi, '')
    // Encode critical chars that could start new HTML contexts
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

// ── Recursive object sanitisation ────────────────────────────────────────

/**
 * Recursively sanitise all string values in an object/array.
 * Non-string primitives (number, boolean, null) are left as-is.
 */
export function sanitizeObject<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj

  if (typeof obj === 'string') {
    return sanitizeInput(obj) as unknown as T
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item)) as unknown as T
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = sanitizeObject(value)
    }
    return result as T
  }

  // number, boolean, etc.
  return obj
}

// ── Email validation ─────────────────────────────────────────────────────

/**
 * Validate an email address.
 * Follows RFC 5322 in a practical (not exhaustive) way.
 */
export function validateEmail(email: string): boolean {
  if (typeof email !== 'string') return false
  // Reasonable upper bound on length (RFC 5321 allows up to 254 chars)
  if (email.length > 254) return false

  const EMAIL_RE =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/
  return EMAIL_RE.test(email)
}

// ── URL validation ───────────────────────────────────────────────────────

/**
 * Validate a URL string. Only http and https protocols are allowed.
 */
export function validateURL(url: string): boolean {
  if (typeof url !== 'string') return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

// ── SQL injection prevention (defence-in-depth) ──────────────────────────

/**
 * Escape a string for safe inclusion in SQL when parameterised queries
 * are not available. This is a BACKUP measure — always prefer parameterised
 * queries via Drizzle ORM.
 *
 * Escapes single quotes, backslashes, NUL bytes, and other characters
 * that can break out of SQL string literals.
 */
export function escapeSQL(input: string): string {
  if (typeof input !== 'string') return ''

  return input
    .replace(/\\/g, '\\\\')     // backslash
    .replace(/'/g, "''")        // single quote → doubled (SQL standard)
    .replace(/"/g, '\\"')       // double quote
    .replace(/\x00/g, '\\0')   // NUL byte
    .replace(/\n/g, '\\n')     // newline
    .replace(/\r/g, '\\r')     // carriage return
    .replace(/\x1a/g, '\\Z')   // Ctrl+Z (EOF on Windows)
    .replace(/;/g, '')          // strip semicolons to prevent statement chaining
    .replace(/--/g, '')         // strip SQL line comments
}
