/**
 * Academy Data Hook — Transparently switches between localStorage (demo) and API (production).
 *
 * In demo mode (non-UUID org IDs), falls back to localStorage.
 * In production mode (real UUID org ID), calls /api/academy.
 *
 * The hook transforms API responses to match the UI's expected shape,
 * so the admin page doesn't need to change its data contracts.
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface UseAcademyDataOpts {
  orgId?: string | null
}

// Transform DB row (camelCase) to UI shape (snake_case with embedded cohorts)
function transformAcademyFromDB(row: any, cohorts: any[], participantCounts: Record<string, number>): any {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    slug: row.slug,
    logo_url: row.logoUrl || row.logo_url || '',
    brand_color: row.brandColor || row.brand_color || '#2563eb',
    welcome_message: row.welcomeMessage || row.welcome_message || '',
    enrollment_type: row.enrollmentType || row.enrollment_type || 'private',
    status: row.status || 'draft',
    cohorts: cohorts.filter((c: any) => (c.academyId || c.academy_id) === row.id).map((c: any) => ({
      id: c.id,
      name: c.name,
      start_date: c.startDate || c.start_date,
      end_date: c.endDate || c.end_date,
      participant_ids: [], // populated separately
      facilitator_name: c.facilitatorName || c.facilitator_name || '',
      status: c.status || 'upcoming',
    })),
    curriculum_course_ids: tryParseJson(row.curriculumCourseIds || row.curriculum_course_ids, []),
    curriculum_path_ids: tryParseJson(row.curriculumPathIds || row.curriculum_path_ids, []),
    completion_rules: tryParseJson(row.completionRules || row.completion_rules, {
      min_courses: 5, require_assessment: true, require_certificate: true,
    }),
    community_enabled: row.communityEnabled ?? row.community_enabled ?? true,
    languages: tryParseJson(row.languages, ['en']),
    created_at: row.createdAt || row.created_at || new Date().toISOString(),
  }
}

function transformParticipantFromDB(row: any): any {
  return {
    id: row.id,
    name: row.fullName || row.full_name || '',
    email: row.email || '',
    business_name: row.businessName || row.business_name || '',
    country: row.country || '',
    language: row.language || 'en',
    academy_id: row.academyId || row.academy_id || '',
    cohort_id: row.cohortId || row.cohort_id || '',
    progress: row.progress || 0,
    status: row.status || 'active',
    enrolled_date: row.enrolledDate || row.enrolled_date || '',
    last_active: row.lastActiveAt || row.last_active_at || row.last_active || '',
  }
}

function transformCommunicationFromDB(row: any): any {
  return {
    id: row.id,
    academy_id: row.academyId || row.academy_id || '',
    type: row.type || 'broadcast',
    trigger_name: row.triggerName || row.trigger_name,
    subject: row.subject || '',
    recipient_count: row.recipientCount || row.recipient_count || 0,
    status: row.status || 'sent',
    sent_at: row.sentAt || row.sent_at || row.createdAt || row.created_at || '',
  }
}

function tryParseJson(val: any, fallback: any): any {
  if (val === null || val === undefined) return fallback
  if (typeof val === 'object') return val
  try { return JSON.parse(val) } catch { return fallback }
}

async function apiFetch(action: string, params?: Record<string, string>) {
  const url = new URL('/api/academy', window.location.origin)
  url.searchParams.set('action', action)
  if (params) Object.entries(params).forEach(([k, v]) => v && url.searchParams.set(k, v))
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Academy API error: ${res.status}`)
  return res.json()
}

async function apiPost(action: string, data: any) {
  const res = await fetch('/api/academy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...data }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(err.error || `Academy API error: ${res.status}`)
  }
  return res.json()
}

export function useAcademyData({ orgId }: UseAcademyDataOpts = {}) {
  const isProduction = orgId ? UUID_RE.test(orgId) : false
  const [loading, setLoading] = useState(false)
  const loadedRef = useRef(false)

  // ── API-based CRUD (production mode) ──

  const fetchAcademies = useCallback(async () => {
    if (!isProduction) return null
    setLoading(true)
    try {
      const [academiesRes, cohortsData] = await Promise.all([
        apiFetch('list'),
        // We'll get cohorts per-academy in the transform
        Promise.resolve({ data: [] }),
      ])

      // For each academy, fetch its cohorts
      const academies = academiesRes.data || []
      const allCohorts: any[] = []
      await Promise.all(
        academies.map(async (a: any) => {
          try {
            const res = await apiFetch('cohorts', { academyId: a.id })
            allCohorts.push(...(res.data || []))
          } catch { /* ignore */ }
        })
      )

      return academies.map((a: any) => transformAcademyFromDB(a, allCohorts, {}))
    } finally {
      setLoading(false)
    }
  }, [isProduction])

  const fetchParticipants = useCallback(async (academyId?: string) => {
    if (!isProduction) return null
    const params: Record<string, string> = { limit: '200' }
    if (academyId) params.academyId = academyId
    const res = await apiFetch('participants', params)
    return (res.data || []).map(transformParticipantFromDB)
  }, [isProduction])

  const fetchCommunications = useCallback(async (academyId: string) => {
    if (!isProduction) return null
    const res = await apiFetch('communications', { academyId })
    return (res.data || []).map(transformCommunicationFromDB)
  }, [isProduction])

  const fetchDashboard = useCallback(async (academyId: string) => {
    if (!isProduction) return null
    const res = await apiFetch('dashboard', { academyId })
    return res.data || null
  }, [isProduction])

  const fetchProgramDashboard = useCallback(async () => {
    if (!isProduction) return null
    const res = await apiFetch('program-dashboard')
    return res.data || null
  }, [isProduction])

  // ── Mutations ──

  const createAcademyAPI = useCallback(async (data: any) => {
    if (!isProduction) return null
    const res = await apiPost('create-academy', data)
    return res.data
  }, [isProduction])

  const updateAcademyAPI = useCallback(async (academyId: string, data: any) => {
    if (!isProduction) return null
    const res = await apiPost('update-academy', { academyId, ...data })
    return res.data
  }, [isProduction])

  const deleteAcademyAPI = useCallback(async (academyId: string) => {
    if (!isProduction) return null
    await apiPost('delete-academy', { academyId })
  }, [isProduction])

  const createParticipantAPI = useCallback(async (data: any) => {
    if (!isProduction) return null
    const res = await apiPost('create-participant', {
      academyId: data.academy_id,
      cohortId: data.cohort_id,
      fullName: data.name,
      email: data.email,
      businessName: data.business_name,
      country: data.country,
      language: data.language,
    })
    return transformParticipantFromDB(res.data)
  }, [isProduction])

  const updateParticipantAPI = useCallback(async (participantId: string, data: any) => {
    if (!isProduction) return null
    const res = await apiPost('update-participant', {
      participantId,
      fullName: data.name,
      email: data.email,
      businessName: data.business_name,
      country: data.country,
      language: data.language,
      status: data.status,
    })
    return transformParticipantFromDB(res.data)
  }, [isProduction])

  const createCohortAPI = useCallback(async (data: any) => {
    if (!isProduction) return null
    const res = await apiPost('create-cohort', {
      academyId: data.academyId,
      name: data.name,
      startDate: data.start_date,
      endDate: data.end_date,
      facilitatorName: data.facilitator_name,
      maxParticipants: data.max_participants,
    })
    return res.data
  }, [isProduction])

  const sendBroadcastAPI = useCallback(async (data: any) => {
    if (!isProduction) return null
    const res = await apiPost('create-communication', {
      academyId: data.academy_id,
      type: 'broadcast',
      subject: data.subject,
      body: data.body,
      recipientCount: data.recipient_count,
      status: 'sent',
    })
    return transformCommunicationFromDB(res.data)
  }, [isProduction])

  return {
    isProduction,
    loading,
    // Queries
    fetchAcademies,
    fetchParticipants,
    fetchCommunications,
    fetchDashboard,
    fetchProgramDashboard,
    // Mutations
    createAcademyAPI,
    updateAcademyAPI,
    deleteAcademyAPI,
    createParticipantAPI,
    updateParticipantAPI,
    createCohortAPI,
    sendBroadcastAPI,
  }
}
