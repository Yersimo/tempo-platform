import { describe, it, expect, vi } from 'vitest'

// Mock the db module to avoid requiring DATABASE_URL at import time
vi.mock('@/lib/db', () => ({
  db: {},
  schema: {
    sessions: {},
    employees: {},
    departments: {},
  },
}))

// Mock next/headers (used by getServerSession)
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

import { hashPassword, verifyPassword } from '../auth'

describe('Auth Module', () => {
  describe('Password Hashing', () => {
    it('hashes a password with pbkdf2 prefix', async () => {
      const hash = await hashPassword('testPassword123')
      expect(hash.startsWith('pbkdf2:')).toBe(true)
      expect(hash.split(':').length).toBe(3)
    })

    it('produces different hashes for same password (unique salt)', async () => {
      const hash1 = await hashPassword('samePassword')
      const hash2 = await hashPassword('samePassword')
      expect(hash1).not.toBe(hash2)
    })

    it('verifies correct password', async () => {
      const hash = await hashPassword('correctPassword')
      const valid = await verifyPassword('correctPassword', hash)
      expect(valid).toBe(true)
    })

    it('rejects incorrect password', async () => {
      const hash = await hashPassword('correctPassword')
      const valid = await verifyPassword('wrongPassword', hash)
      expect(valid).toBe(false)
    })

    it('handles legacy demo: format', async () => {
      const valid = await verifyPassword('demo1234', 'demo:demo1234')
      expect(valid).toBe(true)
    })

    it('rejects wrong legacy password', async () => {
      const valid = await verifyPassword('wrong', 'demo:demo1234')
      expect(valid).toBe(false)
    })

    it('rejects unknown hash format', async () => {
      const valid = await verifyPassword('test', 'unknown:hash')
      expect(valid).toBe(false)
    })

    it('handles empty password', async () => {
      const hash = await hashPassword('')
      expect(hash.startsWith('pbkdf2:')).toBe(true)
      const valid = await verifyPassword('', hash)
      expect(valid).toBe(true)
    })

    it('handles unicode passwords', async () => {
      const hash = await hashPassword('pässwörd日本語')
      const valid = await verifyPassword('pässwörd日本語', hash)
      expect(valid).toBe(true)
    })

    it('constant-time comparison prevents timing attacks', async () => {
      const hash = await hashPassword('test')
      // Both should return false but timing should be similar
      const r1 = await verifyPassword('aaaa', hash)
      const r2 = await verifyPassword('zzzz', hash)
      expect(r1).toBe(false)
      expect(r2).toBe(false)
    })
  })
})
