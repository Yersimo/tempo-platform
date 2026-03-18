'use client'

import { useEffect, useState, useRef } from 'react'
import { AcademyProvider, useAcademy } from '@/lib/academy-store'
import { Skeleton } from '@/components/ui/skeleton'
import { BookOpen, LogOut, User, ChevronDown } from 'lucide-react'

// ─── Auth Guard ───────────────────────────────────────────────────────────────

function AcademyAuthGuard({ children }: { children: React.ReactNode }) {
  const { session, isLoading, error, logout } = useAcademy()
  const [ready, setReady] = useState(false)
  const hasRedirected = useRef(false)

  useEffect(() => {
    if (isLoading) return

    // Check if we're on the login page — don't guard it
    if (window.location.pathname === '/academy/login') {
      setReady(true)
      return
    }

    if (!session || error) {
      if (hasRedirected.current) return
      hasRedirected.current = true
      document.cookie = 'tempo_academy_session=;path=/;max-age=0'
      setTimeout(() => {
        window.location.href = '/academy/login'
      }, 100)
    } else {
      setReady(true)
    }
  }, [session, isLoading, error])

  if (isLoading || !ready) {
    return <AcademyLoadingSkeleton />
  }

  return <>{children}</>
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function AcademyLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-canvas">
      {/* Header skeleton */}
      <div className="h-16 border-b border-border bg-card flex items-center px-6 gap-3">
        <Skeleton height="h-8" width="w-8" className="rounded-lg" />
        <Skeleton height="h-5" width="w-40" />
        <div className="flex-1" />
        <Skeleton height="h-8" width="w-8" className="rounded-full" />
      </div>
      {/* Content skeleton */}
      <main className="max-w-5xl mx-auto p-6 space-y-6 animate-in fade-in duration-300">
        <Skeleton height="h-48" className="rounded-xl" />
        <div className="space-y-2">
          <Skeleton height="h-6" width="w-64" />
          <Skeleton height="h-4" width="w-96" className="opacity-60" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} height="h-32" className="rounded-xl" />
          ))}
        </div>
      </main>
    </div>
  )
}

// ─── Academy Header ───────────────────────────────────────────────────────────

function AcademyHeader() {
  const { session, logout } = useAcademy()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!session) return null

  const { academy, participant } = session
  const brandColor = academy.brandColor || '#00567A'
  const initials = participant.fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <header className="h-16 border-b border-border bg-card flex items-center px-4 sm:px-6 gap-3 sticky top-0 z-50">
      {/* Academy branding */}
      <div className="flex items-center gap-3 min-w-0">
        {academy.logoUrl ? (
          <img src={academy.logoUrl} alt={academy.name} className="h-8 w-8 rounded-lg object-cover" />
        ) : (
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center text-white"
            style={{ backgroundColor: brandColor }}
          >
            <BookOpen className="h-4 w-4" />
          </div>
        )}
        <span className="font-semibold text-primary truncate hidden sm:block">
          {academy.name}
        </span>
      </div>

      <div className="flex-1" />

      {/* Participant dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 hover:bg-hover rounded-lg px-2 py-1.5 transition-colors"
        >
          {participant.avatarUrl ? (
            <img src={participant.avatarUrl} alt={participant.fullName} className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-medium"
              style={{ backgroundColor: brandColor }}
            >
              {initials}
            </div>
          )}
          <span className="text-sm text-primary hidden sm:block">{participant.fullName}</span>
          <ChevronDown className="h-3.5 w-3.5 text-secondary" />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-1 w-56 bg-card border border-border rounded-xl shadow-lg py-1 z-50">
            <div className="px-3 py-2 border-b border-border">
              <p className="text-sm font-medium text-primary">{participant.fullName}</p>
              <p className="text-xs text-secondary truncate">{participant.email}</p>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-secondary hover:bg-hover hover:text-primary transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function AcademyLayout({ children }: { children: React.ReactNode }) {
  return (
    <AcademyProvider>
      <AcademyAuthGuard>
        <div className="min-h-screen bg-canvas">
          <AcademyHeader />
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </AcademyAuthGuard>
    </AcademyProvider>
  )
}
