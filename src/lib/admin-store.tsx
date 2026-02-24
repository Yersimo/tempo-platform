'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { getDemoDataForOrg } from './demo-data'

// ─── Types ───────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string
  email: string
  name: string
  role: string
}

export interface AdminOrg {
  id: string
  name: string
  slug: string
  logo_url?: string | null
  logoUrl?: string | null
  plan: string
  industry?: string | null
  size?: string | null
  country?: string | null
  isActive: boolean
  employeeCount: number
  created_at?: string
  createdAt?: string
}

export interface AdminOrgEmployee {
  id: string
  org_id: string
  department_id: string | null
  job_title: string
  level: string
  country: string
  role: string
  profile: {
    full_name: string
    email: string
    avatar_url: string | null
    phone?: string
  }
}

export interface AdminStats {
  totalOrgs: number
  activeOrgs: number
  totalEmployees: number
  activeEmployees: number
  orgsByPlan: Record<string, number>
}

// ─── Context ─────────────────────────────────────────────────────────────

interface AdminStoreState {
  adminUser: AdminUser | null
  organizations: AdminOrg[]
  stats: AdminStats | null
  isLoading: boolean
  error: string | null

  loginAdmin: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  logoutAdmin: () => Promise<void>
  fetchOrganizations: () => Promise<void>
  fetchStats: () => Promise<void>
  getOrgEmployees: (orgId: string) => AdminOrgEmployee[]
  toggleOrgActive: (orgId: string, isActive: boolean) => Promise<void>
  impersonateUser: (employeeId: string, orgId: string) => Promise<{ ok: boolean; error?: string }>
}

const AdminContext = createContext<AdminStoreState | null>(null)

// ─── Provider ────────────────────────────────────────────────────────────

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [organizations, setOrganizations] = useState<AdminOrg[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const initialized = useRef(false)

  // ─── Init: check existing session ──────────────────────────────────
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    async function initSession() {
      try {
        const res = await fetch('/api/admin/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'me' }),
        })
        if (res.ok) {
          const data = await res.json()
          if (data.admin) {
            setAdminUser(data.admin)
          }
        }
      } catch {
        // Not authenticated — that's fine
      } finally {
        setIsLoading(false)
      }
    }

    initSession()
  }, [])

  // ─── Login ─────────────────────────────────────────────────────────
  const loginAdmin = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        return { ok: false, error: data.error || 'Login failed' }
      }
      setAdminUser(data.admin)
      return { ok: true }
    } catch {
      return { ok: false, error: 'Network error' }
    }
  }, [])

  // ─── Logout ────────────────────────────────────────────────────────
  const logoutAdmin = useCallback(async () => {
    try {
      await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      })
    } catch { /* ignore */ }
    setAdminUser(null)
    setOrganizations([])
    setStats(null)
  }, [])

  // ─── Fetch Organizations ───────────────────────────────────────────
  const fetchOrganizations = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/organizations')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setOrganizations(data.organizations || [])
    } catch {
      // Fallback to demo data
      const org1 = getDemoDataForOrg('org-1')
      const org2 = getDemoDataForOrg('org-2')
      setOrganizations([
        { ...org1.org, isActive: true, employeeCount: org1.employees.length },
        { ...org2.org, isActive: true, employeeCount: org2.employees.length },
      ])
    }
  }, [])

  // ─── Fetch Stats ───────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stats')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setStats(data.stats)
    } catch {
      // Fallback to demo stats
      const org1 = getDemoDataForOrg('org-1')
      const org2 = getDemoDataForOrg('org-2')
      setStats({
        totalOrgs: 2,
        activeOrgs: 2,
        totalEmployees: org1.employees.length + org2.employees.length,
        activeEmployees: org1.employees.length + org2.employees.length,
        orgsByPlan: { enterprise: 1, professional: 1 },
      })
    }
  }, [])

  // ─── Get Employees for an Org (demo) ───────────────────────────────
  const getOrgEmployees = useCallback((orgId: string): AdminOrgEmployee[] => {
    try {
      const data = getDemoDataForOrg(orgId)
      return data.employees
    } catch {
      return []
    }
  }, [])

  // ─── Toggle Org Active ─────────────────────────────────────────────
  const toggleOrgActive = useCallback(async (orgId: string, isActive: boolean) => {
    try {
      await fetch('/api/admin/organizations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orgId, isActive }),
      })
    } catch { /* ignore for demo */ }
    // Optimistic update
    setOrganizations(prev => prev.map(o =>
      o.id === orgId ? { ...o, isActive } : o
    ))
  }, [])

  // ─── Impersonate User ──────────────────────────────────────────────
  const impersonateUser = useCallback(async (employeeId: string, orgId: string) => {
    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', employeeId, orgId }),
      })
      const data = await res.json()
      if (!res.ok) {
        return { ok: false, error: data.error || 'Impersonation failed' }
      }
      return { ok: true }
    } catch {
      return { ok: false, error: 'Network error' }
    }
  }, [])

  const value: AdminStoreState = {
    adminUser,
    organizations,
    stats,
    isLoading,
    error,
    loginAdmin,
    logoutAdmin,
    fetchOrganizations,
    fetchStats,
    getOrgEmployees,
    toggleOrgActive,
    impersonateUser,
  }

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  )
}

// ─── Hook ────────────────────────────────────────────────────────────────

export function useAdmin(): AdminStoreState {
  const ctx = useContext(AdminContext)
  if (!ctx) {
    throw new Error('useAdmin must be used within <AdminProvider>')
  }
  return ctx
}
