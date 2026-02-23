'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

export interface SearchResult {
  id: string
  type: string
  title: string
  subtitle: string
  link: string
  icon: string
}

export interface UseSearchReturn {
  query: string
  setQuery: (q: string) => void
  results: SearchResult[]
  isLoading: boolean
  error: string | null
  total: number
}

export function useSearch(): UseSearchReturn {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const abortRef = useRef<AbortController | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const performSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([])
      setTotal(0)
      return
    }

    // Abort previous request
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=20`, {
        signal: abortRef.current.signal,
      })

      if (!res.ok) throw new Error('Search failed')

      const data = await res.json()
      setResults(data.results || [])
      setTotal(data.total || 0)
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return
      setError('Search failed')
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(() => {
      performSearch(query)
    }, 200)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, performSearch])

  // Cleanup on unmount
  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  return { query, setQuery, results, isLoading, error, total }
}
