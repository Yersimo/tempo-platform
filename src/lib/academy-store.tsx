'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AcademyParticipant {
  id: string
  fullName: string
  email: string
  avatarUrl?: string
  academyId: string
  academySlug?: string
  cohortId?: string
  progress: number
  language?: string
  businessName?: string
  country?: string
  status: string
}

export interface AcademyInfo {
  id: string
  name: string
  slug: string
  brandColor: string
  logoUrl?: string
  description?: string
  welcomeMessage?: string
}

export interface AcademySession {
  participant: AcademyParticipant
  academy: AcademyInfo
}

interface AcademyContextValue {
  session: AcademySession | null
  isLoading: boolean
  error: string | null
  logout: () => Promise<void>
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AcademyContext = createContext<AcademyContextValue>({
  session: null,
  isLoading: true,
  error: null,
  logout: async () => {},
})

export function useAcademy() {
  return useContext(AcademyContext)
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AcademyProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AcademySession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadSession() {
      try {
        // 1. Verify participant session
        const authRes = await fetch('/api/academy/auth', { credentials: 'include' })
        if (!authRes.ok) {
          setError('Session expired')
          setIsLoading(false)
          return
        }
        const { participant: p } = await authRes.json()
        if (!p) {
          setError('No participant data')
          setIsLoading(false)
          return
        }

        // 2. Fetch academy metadata
        let academy: AcademyInfo = {
          id: p.academyId || '',
          name: 'Academy',
          slug: '',
          brandColor: '#00567A',
        }

        if (p.academyId) {
          try {
            const acadRes = await fetch(`/api/academy?action=get&academyId=${p.academyId}`)
            if (acadRes.ok) {
              const { data: acad } = await acadRes.json()
              if (acad) {
                academy = {
                  id: acad.id,
                  name: acad.name,
                  slug: acad.slug,
                  brandColor: acad.brandColor || acad.brand_color || '#00567A',
                  logoUrl: acad.logoUrl || acad.logo_url || undefined,
                  description: acad.description || undefined,
                  welcomeMessage: acad.welcomeMessage || acad.welcome_message || undefined,
                }
              }
            }
          } catch {
            // Use defaults if academy fetch fails
          }
        }

        setSession({
          participant: {
            id: p.id,
            fullName: p.fullName || p.full_name || 'Participant',
            email: p.email,
            avatarUrl: p.avatarUrl || p.avatar_url || undefined,
            academyId: p.academyId || p.academy_id || '',
            academySlug: p.academySlug || p.academy_slug || academy.slug,
            cohortId: p.cohortId || p.cohort_id || undefined,
            progress: p.progress ?? 0,
            language: p.language || 'en',
            businessName: p.businessName || p.business_name || undefined,
            country: p.country || undefined,
            status: p.status || 'active',
          },
          academy,
        })
      } catch {
        setError('Failed to load session')
      } finally {
        setIsLoading(false)
      }
    }

    loadSession()
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch('/api/academy/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
        credentials: 'include',
      })
    } catch {
      // Clear cookie client-side as fallback
    }
    document.cookie = 'tempo_academy_session=;path=/;max-age=0'
    window.location.href = '/academy/login'
  }, [])

  return (
    <AcademyContext.Provider value={{ session, isLoading, error, logout }}>
      {children}
    </AcademyContext.Provider>
  )
}
