// Vault Encryption Service
// AES-256-GCM encryption for password vault items with scrypt key derivation
// Uses k-anonymity approach for breach checking (SHA-1 prefix matching)

import { createCipheriv, createDecipheriv, randomBytes, scryptSync, createHash } from 'crypto'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32 // 256 bits
const IV_LENGTH = 16 // 128 bits
const TAG_LENGTH = 16 // 128 bits
const SALT_LENGTH = 32
const SCRYPT_N = 16384 // CPU/memory cost parameter
const SCRYPT_R = 8 // block size
const SCRYPT_P = 1 // parallelization

// ---------------------------------------------------------------------------
// Key Derivation
// ---------------------------------------------------------------------------

/**
 * Derive a 256-bit encryption key from a password using scrypt.
 * scrypt is memory-hard, making brute-force attacks expensive.
 */
export function deriveKey(password: string, salt: string): Buffer {
  return scryptSync(password, Buffer.from(salt, 'hex'), KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  })
}

/**
 * Generate a cryptographically secure random salt (hex-encoded).
 */
export function generateSalt(): string {
  return randomBytes(SALT_LENGTH).toString('hex')
}

/**
 * Hash a master password for storage/verification.
 * Uses scrypt + an additional SHA-256 pass so the derived key is never stored directly.
 */
export function hashMasterPassword(password: string, salt: string): string {
  const derived = deriveKey(password, salt)
  return createHash('sha256').update(derived).digest('hex')
}

// ---------------------------------------------------------------------------
// Encryption / Decryption (AES-256-GCM)
// ---------------------------------------------------------------------------

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns the ciphertext, IV, and auth tag (all hex-encoded).
 */
export function encryptVaultItem(
  plaintext: string,
  masterKey: string,
): { encrypted: string; iv: string; tag: string } {
  const salt = generateSalt()
  const key = deriveKey(masterKey, salt)
  const iv = randomBytes(IV_LENGTH)

  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH })
  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const tag = cipher.getAuthTag()

  // Prepend salt to encrypted data so we can re-derive the key on decrypt
  return {
    encrypted: salt + ':' + encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
  }
}

/**
 * Decrypt a ciphertext string using AES-256-GCM.
 * Expects the format produced by encryptVaultItem.
 */
export function decryptVaultItem(
  encrypted: string,
  iv: string,
  tag: string,
  masterKey: string,
): string {
  const [salt, ciphertext] = encrypted.split(':')
  if (!salt || !ciphertext) throw new Error('Invalid encrypted data format')

  const key = deriveKey(masterKey, salt)
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'hex'), {
    authTagLength: TAG_LENGTH,
  })
  decipher.setAuthTag(Buffer.from(tag, 'hex'))

  let decrypted = decipher.update(ciphertext, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

// ---------------------------------------------------------------------------
// Breach Detection (k-Anonymity / HIBP-compatible)
// ---------------------------------------------------------------------------

/**
 * Generate the SHA-1 hash of a password, split into prefix (5 chars) and suffix.
 * This enables k-anonymity breach checking: only the prefix is sent to the API,
 * and the full hash is compared locally against returned suffixes.
 */
export function hashForBreachCheck(password: string): { prefix: string; suffix: string; full: string } {
  const sha1 = createHash('sha1').update(password).digest('hex').toUpperCase()
  return {
    prefix: sha1.substring(0, 5),
    suffix: sha1.substring(5),
    full: sha1,
  }
}

/**
 * Check a single password against the HIBP Pwned Passwords API (k-anonymity).
 * Returns the number of times the password has appeared in breaches (0 = safe).
 */
export async function checkPasswordBreach(password: string): Promise<number> {
  const { prefix, suffix } = hashForBreachCheck(password)
  try {
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'User-Agent': 'Tempo-Platform-PasswordManager' },
    })
    if (!res.ok) return 0
    const body = await res.text()
    const lines = body.split('\n')
    for (const line of lines) {
      const [hashSuffix, count] = line.trim().split(':')
      if (hashSuffix === suffix) {
        return parseInt(count, 10) || 0
      }
    }
    return 0
  } catch {
    // Network errors should not block the user
    return 0
  }
}

// ---------------------------------------------------------------------------
// Password Health Scoring
// ---------------------------------------------------------------------------

export interface PasswordHealthResult {
  overallScore: number // 0-100
  strongCount: number
  mediumCount: number
  weakCount: number
  reusedCount: number
  oldCount: number // not rotated in >90 days
  breachedCount: number
  totalItems: number
  strongPercentage: number
  issues: PasswordIssue[]
}

export interface PasswordIssue {
  type: 'weak' | 'reused' | 'old' | 'breached'
  itemId: string
  itemName: string
  detail: string
}

/**
 * Score the overall health of a vault based on item metadata.
 * This runs client-side without needing plaintext passwords.
 */
export function computeVaultHealth(items: Array<{
  id: string
  name: string
  strength?: string
  password_changed_at?: string | null
  created_at?: string
  // For reuse detection we rely on a hash comparison done server-side
  passwordHash?: string
}>): PasswordHealthResult {
  const now = Date.now()
  const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000
  const issues: PasswordIssue[] = []

  let strongCount = 0
  let mediumCount = 0
  let weakCount = 0
  let oldCount = 0

  // Detect reused passwords by comparing hashes
  const hashCounts = new Map<string, string[]>()
  for (const item of items) {
    if (item.passwordHash) {
      const existing = hashCounts.get(item.passwordHash) || []
      existing.push(item.id)
      hashCounts.set(item.passwordHash, existing)
    }
  }
  const reusedIds = new Set<string>()
  for (const [, ids] of hashCounts) {
    if (ids.length > 1) {
      ids.forEach((id) => reusedIds.add(id))
    }
  }

  for (const item of items) {
    // Strength scoring
    if (item.strength === 'strong' || item.strength === 'very_strong') {
      strongCount++
    } else if (item.strength === 'medium' || item.strength === 'fair') {
      mediumCount++
      issues.push({ type: 'weak', itemId: item.id, itemName: item.name, detail: 'Password strength is medium' })
    } else {
      weakCount++
      issues.push({ type: 'weak', itemId: item.id, itemName: item.name, detail: 'Password is weak and should be updated' })
    }

    // Age check
    const changedAt = item.password_changed_at || item.created_at
    if (changedAt && now - new Date(changedAt).getTime() > NINETY_DAYS) {
      oldCount++
      issues.push({ type: 'old', itemId: item.id, itemName: item.name, detail: 'Password has not been rotated in over 90 days' })
    }

    // Reuse check
    if (reusedIds.has(item.id)) {
      issues.push({ type: 'reused', itemId: item.id, itemName: item.name, detail: 'This password is reused across multiple services' })
    }
  }

  const totalItems = items.length || 1
  const strongPercentage = Math.round((strongCount / totalItems) * 100)

  // Overall score: weighted formula
  // 40% strength, 30% uniqueness, 20% freshness, 10% breach-free
  const strengthScore = (strongCount / totalItems) * 40
  const uniquenessScore = ((totalItems - reusedIds.size) / totalItems) * 30
  const freshnessScore = ((totalItems - oldCount) / totalItems) * 20
  // Breach score starts at max (set externally)
  const baseScore = Math.round(strengthScore + uniquenessScore + freshnessScore + 10)

  return {
    overallScore: Math.min(100, Math.max(0, baseScore)),
    strongCount,
    mediumCount,
    weakCount,
    reusedCount: reusedIds.size,
    oldCount,
    breachedCount: 0, // populated externally after breach checks
    totalItems: items.length,
    strongPercentage,
    issues,
  }
}

// ---------------------------------------------------------------------------
// Secure Sharing Types
// ---------------------------------------------------------------------------

export interface SharedAccess {
  employeeId: string
  accessLevel: 'view' | 'full'
  sharedAt: string
  sharedBy: string
  expiresAt?: string
}

export interface SharingAuditEntry {
  id: string
  action: 'shared' | 'revoked' | 'accessed' | 'modified'
  itemId: string
  performedBy: string
  targetEmployee?: string
  timestamp: string
  details?: string
}

// ---------------------------------------------------------------------------
// Rotation Policy Types
// ---------------------------------------------------------------------------

export interface RotationPolicy {
  vaultId: string
  rotationDays: 30 | 60 | 90 | 180
  enforced: boolean
  notifyDaysBefore: number
  lastCheckedAt?: string
}

export interface RotationHistoryEntry {
  itemId: string
  rotatedAt: string
  rotatedBy: string
  previousStrength?: string
  newStrength?: string
}

/**
 * Check which items in a vault need rotation based on the policy.
 */
export function getItemsNeedingRotation(
  items: Array<{
    id: string
    name: string
    password_changed_at?: string | null
    created_at?: string
  }>,
  policy: RotationPolicy,
): Array<{ id: string; name: string; daysSinceRotation: number; overdue: boolean }> {
  const now = Date.now()
  const policyMs = policy.rotationDays * 24 * 60 * 60 * 1000
  const notifyMs = policy.notifyDaysBefore * 24 * 60 * 60 * 1000

  return items.map((item) => {
    const changedAt = item.password_changed_at || item.created_at || new Date().toISOString()
    const elapsed = now - new Date(changedAt).getTime()
    const daysSinceRotation = Math.floor(elapsed / (24 * 60 * 60 * 1000))
    const overdue = elapsed > policyMs
    const nearingExpiry = elapsed > policyMs - notifyMs

    return { id: item.id, name: item.name, daysSinceRotation, overdue }
  }).filter((r) => r.overdue || r.daysSinceRotation >= policy.rotationDays - policy.notifyDaysBefore)
}
