'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Hybrid AI hook: returns deterministic result instantly, enhances with Claude async.
 * Falls back silently on error/timeout. Caches results in-memory.
 */

interface UseAIOptions<T> {
  /** The AI action to call (maps to /api/ai action) */
  action: string
  /** Data payload sent to Claude */
  data: unknown
  /** Instant deterministic fallback result */
  fallback: T
  /** Whether to fire the Claude call (default: true) */
  enabled?: boolean
  /** Optional cache key override */
  cacheKey?: string
}

interface UseAIResult<T> {
  /** Best available result: enhanced if Claude responded, fallback otherwise */
  result: T
  /** True when Claude response has replaced the fallback */
  isEnhanced: boolean
  /** True while Claude call is in flight */
  isLoading: boolean
  /** Error message if Claude call failed */
  error: string | null
}

// Simple in-memory LRU cache
const cache = new Map<string, { data: unknown; timestamp: number }>()
const MAX_CACHE = 50
const CACHE_TTL = 5 * 60_000 // 5 minutes

function getCached<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key)
    return null
  }
  return entry.data as T
}

function setCache(key: string, data: unknown) {
  // Evict oldest if full
  if (cache.size >= MAX_CACHE) {
    const oldest = cache.keys().next().value
    if (oldest !== undefined) cache.delete(oldest)
  }
  cache.set(key, { data, timestamp: Date.now() })
}

export function useAI<T>(options: UseAIOptions<T>): UseAIResult<T> {
  const { action, data, fallback, enabled = true, cacheKey } = options

  const [enhanced, setEnhanced] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Stable serialized key
  const key = cacheKey || `${action}:${JSON.stringify(data)}`.slice(0, 500)

  const fetchEnhancement = useCallback(async () => {
    // Check cache first
    const cached = getCached<T>(key)
    if (cached) {
      setEnhanced(cached)
      return
    }

    setIsLoading(true)
    setError(null)

    const controller = new AbortController()
    abortRef.current = controller

    // 10 second timeout
    const timeout = setTimeout(() => controller.abort(), 10_000)

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, data }),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'AI request failed' }))
        if (err.fallback) {
          // Expected fallback -- silently use deterministic
          setIsLoading(false)
          return
        }
        throw new Error(err.error || 'AI request failed')
      }

      const { result } = await res.json()
      setEnhanced(result as T)
      setCache(key, result)
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Timeout or unmount -- silent
      } else {
        const msg = err instanceof Error ? err.message : 'AI enhancement failed'
        setError(msg)
        console.warn('[useAI]', msg)
      }
    } finally {
      setIsLoading(false)
    }
  }, [action, key, data])

  useEffect(() => {
    if (!enabled) return
    fetchEnhancement()

    return () => {
      abortRef.current?.abort()
    }
  }, [enabled, fetchEnhancement])

  return {
    result: enhanced ?? fallback,
    isEnhanced: enhanced !== null,
    isLoading,
    error,
  }
}
