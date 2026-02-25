/**
 * In-memory TTL cache with namespace support
 * Drop-in replacement for Redis/Upstash when infrastructure is available
 */

// ─── Types ──────────────────────────────────────────────────────────

interface CacheEntry<T = unknown> {
  value: T
  expiresAt: number
  createdAt: number
  tags: string[]
}

interface CacheOptions {
  maxEntries?: number
  cleanupIntervalMs?: number
}

interface CacheStats {
  size: number
  hitRate: number
  missRate: number
  evictions: number
}

// ─── MemoryCache Class ──────────────────────────────────────────────

class MemoryCache {
  private store: Map<string, CacheEntry>
  private cleanupInterval: ReturnType<typeof setInterval> | null
  private readonly maxEntries: number
  private hits = 0
  private misses = 0
  private evictions = 0

  constructor(options?: CacheOptions) {
    this.store = new Map()
    this.cleanupInterval = null
    this.maxEntries = options?.maxEntries ?? 10_000

    const intervalMs = options?.cleanupIntervalMs ?? 60_000
    this.cleanupInterval = setInterval(() => this.removeExpired(), intervalMs)

    // Allow Node.js to exit even with active timer
    if (this.cleanupInterval && typeof this.cleanupInterval === 'object' && 'unref' in this.cleanupInterval) {
      this.cleanupInterval.unref()
    }
  }

  // ── Core operations ─────────────────────────────────────────────

  get<T>(key: string): T | null {
    const entry = this.store.get(key)
    if (!entry) {
      this.misses++
      return null
    }
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      this.misses++
      return null
    }
    this.hits++
    return entry.value as T
  }

  set<T>(key: string, value: T, ttlMs: number = CacheTTL.MEDIUM, tags: string[] = []): void {
    // Evict oldest if at capacity
    if (!this.store.has(key) && this.store.size >= this.maxEntries) {
      this.evictOldest()
    }
    // Delete first so insertion order is updated (for LRU)
    if (this.store.has(key)) {
      this.store.delete(key)
    }
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
      createdAt: Date.now(),
      tags,
    } as CacheEntry)
  }

  has(key: string): boolean {
    const entry = this.store.get(key)
    if (!entry) return false
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return false
    }
    return true
  }

  delete(key: string): boolean {
    return this.store.delete(key)
  }

  // ── Bulk operations ─────────────────────────────────────────────

  getMany<T>(keys: string[]): Map<string, T | null> {
    const results = new Map<string, T | null>()
    for (const key of keys) {
      results.set(key, this.get<T>(key))
    }
    return results
  }

  deleteMany(keys: string[]): number {
    let count = 0
    for (const key of keys) {
      if (this.store.delete(key)) count++
    }
    return count
  }

  // ── Pattern-based invalidation ──────────────────────────────────

  invalidateByPrefix(prefix: string): number {
    let count = 0
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key)
        count++
      }
    }
    return count
  }

  invalidateByTag(tag: string): number {
    let count = 0
    for (const [key, entry] of this.store.entries()) {
      if (entry.tags.includes(tag)) {
        this.store.delete(key)
        count++
      }
    }
    return count
  }

  invalidateByPattern(pattern: string): number {
    const regexStr = '^' + pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$'
    const regex = new RegExp(regexStr)
    let count = 0
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key)
        count++
      }
    }
    return count
  }

  // ── Cache-aside pattern ─────────────────────────────────────────

  async getOrSet<T>(
    key: string,
    factory: () => T | Promise<T>,
    ttlMs: number = CacheTTL.MEDIUM,
    tags: string[] = [],
  ): Promise<T> {
    const cached = this.get<T>(key)
    if (cached !== null) return cached
    const value = await factory()
    this.set(key, value, ttlMs, tags)
    return value
  }

  // ── Stats ───────────────────────────────────────────────────────

  stats(): CacheStats {
    const total = this.hits + this.misses
    return {
      size: this.store.size,
      hitRate: total === 0 ? 0 : this.hits / total,
      missRate: total === 0 ? 0 : this.misses / total,
      evictions: this.evictions,
    }
  }

  // ── Management ──────────────────────────────────────────────────

  clear(): void {
    this.store.clear()
    this.hits = 0
    this.misses = 0
    this.evictions = 0
  }

  dispose(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }

  // ── Internal helpers ────────────────────────────────────────────

  private removeExpired(): void {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key)
      }
    }
  }

  private evictOldest(): void {
    const oldestKey = this.store.keys().next().value
    if (oldestKey !== undefined) {
      this.store.delete(oldestKey)
      this.evictions++
    }
  }
}

// ─── Singleton ──────────────────────────────────────────────────────

export const cache = new MemoryCache({ maxEntries: 10_000, cleanupIntervalMs: 60_000 })

// ─── Pre-built cache key helpers ────────────────────────────────────

export const CacheKeys = {
  moduleData: (orgId: string, module: string, page?: number) =>
    `data:${orgId}:${module}${page ? `:page:${page}` : ''}`,
  search: (orgId: string, query: string) =>
    `search:${orgId}:${query.toLowerCase().trim()}`,
  analytics: (orgId: string, type: string) =>
    `analytics:${orgId}:${type}`,
  employee: (orgId: string, employeeId: string) =>
    `employee:${orgId}:${employeeId}`,
  compliance: (orgId: string) =>
    `compliance:${orgId}`,
}

export const CacheTTL = {
  SHORT: 30_000,         // 30 seconds (search results)
  MEDIUM: 60_000,        // 1 minute (module data)
  LONG: 300_000,         // 5 minutes (analytics)
  VERY_LONG: 3_600_000,  // 1 hour (static config)
}

// ─── Middleware / route helpers ──────────────────────────────────────

export function withCache<T>(
  key: string,
  ttlMs: number,
  factory: () => Promise<T>,
  tags?: string[],
): Promise<T> {
  return cache.getOrSet(key, factory, ttlMs, tags)
}

export function invalidateEntityCache(orgId: string, entity: string): void {
  cache.invalidateByPrefix(`data:${orgId}:${entity}`)
  cache.invalidateByTag(`org:${orgId}`)
}

export { MemoryCache }
export type { CacheEntry, CacheOptions, CacheStats }
