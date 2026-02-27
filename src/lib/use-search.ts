'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useTempoSafe } from '@/lib/store'

export interface SearchResult {
  id: string
  type: string
  title: string
  subtitle: string
  link: string
  icon: string
  /** 0-1 relevance score for sorting */
  score?: number
}

export interface UseSearchReturn {
  query: string
  setQuery: (q: string) => void
  results: SearchResult[]
  isLoading: boolean
  error: string | null
  total: number
}

// ---------------------------------------------------------------------------
// Fuzzy matching helpers
// ---------------------------------------------------------------------------

/** Score a single field against the query. Returns 0-1 relevance. */
function scoreMatch(field: string | null | undefined, query: string): number {
  if (!field) return 0
  const lower = field.toLowerCase()
  const q = query.toLowerCase()
  if (lower === q) return 1                          // exact
  if (lower.startsWith(q)) return 0.9                // prefix
  const words = lower.split(/\s+/)
  if (words.some(w => w.startsWith(q))) return 0.75  // word-prefix
  if (lower.includes(q)) return 0.6                  // substring
  // token match: every query word appears somewhere
  const qWords = q.split(/\s+/)
  if (qWords.length > 1 && qWords.every(w => lower.includes(w))) return 0.5
  return 0
}

/** Best score from multiple fields */
function bestScore(fields: (string | null | undefined)[], query: string): number {
  let best = 0
  for (const f of fields) {
    const s = scoreMatch(f, query)
    if (s > best) best = s
    if (best === 1) return 1
  }
  return best
}

// ---------------------------------------------------------------------------
// Client-side search across all store entities
// ---------------------------------------------------------------------------

function searchStore(
  store: NonNullable<ReturnType<typeof useTempoSafe>>,
  query: string,
  limit: number = 25,
): SearchResult[] {
  if (query.length < 2) return []

  const results: SearchResult[] = []
  const q = query.toLowerCase()

  // Helper to look up employee name
  const empName = (id: string | null | undefined) => {
    if (!id) return ''
    const e = store.employees.find(e => e.id === id)
    return e?.profile?.full_name || ''
  }

  // Helper to look up department name
  const deptName = (id: string | null | undefined) => {
    if (!id) return ''
    const d = store.departments.find(d => d.id === id)
    return d?.name || ''
  }

  // ── Employees ──────────────────────────────────────────────────────
  for (const e of store.employees) {
    const score = bestScore([
      e.profile?.full_name,
      e.profile?.email,
      e.job_title,
      deptName(e.department_id),
    ], q)
    if (score > 0) {
      results.push({
        id: e.id,
        type: 'employee',
        title: e.profile?.full_name || 'Unknown',
        subtitle: `${e.job_title || 'Employee'} · ${deptName(e.department_id) || e.country || ''}`,
        link: `/people/${e.id}`,
        icon: 'User',
        score,
      })
    }
  }

  // ── Departments ────────────────────────────────────────────────────
  for (const d of store.departments) {
    const score = bestScore([d.name], q)
    if (score > 0) {
      const headName = empName(d.head_id)
      results.push({
        id: d.id,
        type: 'department',
        title: d.name,
        subtitle: headName ? `Head: ${headName}` : 'Department',
        link: '/people',
        icon: 'Building2',
        score,
      })
    }
  }

  // ── Goals ──────────────────────────────────────────────────────────
  for (const g of store.goals) {
    const score = bestScore([g.title, g.description, g.category], q)
    if (score > 0) {
      results.push({
        id: g.id,
        type: 'goal',
        title: g.title,
        subtitle: `${g.status} · ${g.category || 'Goal'} · ${empName(g.employee_id) || ''}`,
        link: '/performance',
        icon: 'Target',
        score,
      })
    }
  }

  // ── Review Cycles ──────────────────────────────────────────────────
  for (const rc of store.reviewCycles) {
    const score = bestScore([rc.title, rc.type], q)
    if (score > 0) {
      results.push({
        id: rc.id,
        type: 'review',
        title: rc.title,
        subtitle: `${rc.type} Review · ${rc.status}`,
        link: '/performance',
        icon: 'ClipboardCheck',
        score,
      })
    }
  }

  // ── Projects ───────────────────────────────────────────────────────
  for (const p of store.projects) {
    const score = bestScore([p.title, p.description], q)
    if (score > 0) {
      results.push({
        id: p.id,
        type: 'project',
        title: p.title,
        subtitle: `Project · ${p.status} · ${empName(p.owner_id) || ''}`,
        link: '/projects',
        icon: 'FolderKanban',
        score,
      })
    }
  }

  // ── Tasks ──────────────────────────────────────────────────────────
  for (const t of store.tasks) {
    const score = bestScore([t.title, t.description], q)
    if (score > 0) {
      results.push({
        id: t.id,
        type: 'task',
        title: t.title,
        subtitle: `${t.priority} priority · ${t.status} · ${empName(t.assignee_id) || ''}`,
        link: '/projects',
        icon: 'CheckSquare',
        score,
      })
    }
  }

  // ── Courses ────────────────────────────────────────────────────────
  for (const c of store.courses) {
    const score = bestScore([c.title, c.description, c.category], q)
    if (score > 0) {
      results.push({
        id: c.id,
        type: 'course',
        title: c.title,
        subtitle: `${c.format || 'Course'} · ${c.level || ''} · ${c.duration_hours || ''}h`,
        link: '/learning',
        icon: 'BookOpen',
        score,
      })
    }
  }

  // ── Job Postings ───────────────────────────────────────────────────
  for (const j of store.jobPostings) {
    const score = bestScore([j.title, j.description, j.location], q)
    if (score > 0) {
      results.push({
        id: j.id,
        type: 'job',
        title: j.title,
        subtitle: `${j.status} · ${j.location || ''} · ${j.type || ''}`,
        link: '/recruiting',
        icon: 'Briefcase',
        score,
      })
    }
  }

  // ── Applications (candidates) ──────────────────────────────────────
  for (const a of store.applications) {
    const score = bestScore([a.candidate_name, a.candidate_email, a.stage], q)
    if (score > 0) {
      results.push({
        id: a.id,
        type: 'candidate',
        title: a.candidate_name,
        subtitle: `${a.stage || a.status} · ${a.candidate_email || ''}`,
        link: '/recruiting',
        icon: 'UserPlus',
        score,
      })
    }
  }

  // ── Payroll Runs ───────────────────────────────────────────────────
  for (const pr of store.payrollRuns) {
    const score = bestScore([pr.period, pr.status], q)
    if (score > 0) {
      results.push({
        id: pr.id,
        type: 'payroll',
        title: `Payroll: ${pr.period}`,
        subtitle: `${pr.status} · ${pr.employee_count || 0} employees · ${pr.currency || ''} ${Number(pr.total_net || 0).toLocaleString()}`,
        link: '/payroll',
        icon: 'Banknote',
        score,
      })
    }
  }

  // ── Leave Requests ─────────────────────────────────────────────────
  for (const lr of store.leaveRequests) {
    const score = bestScore([lr.type, lr.reason, empName(lr.employee_id)], q)
    if (score > 0) {
      results.push({
        id: lr.id,
        type: 'leave',
        title: `${lr.type} Leave · ${lr.days} days`,
        subtitle: `${lr.status} · ${empName(lr.employee_id)} · ${lr.start_date} to ${lr.end_date}`,
        link: '/time-attendance',
        icon: 'CalendarCheck',
        score,
      })
    }
  }

  // ── Benefit Plans ──────────────────────────────────────────────────
  for (const bp of store.benefitPlans) {
    const score = bestScore([bp.name, bp.type, bp.provider, bp.description], q)
    if (score > 0) {
      results.push({
        id: bp.id,
        type: 'benefit',
        title: bp.name,
        subtitle: `${bp.type} · ${bp.provider || 'Benefit Plan'}`,
        link: '/benefits',
        icon: 'Shield',
        score,
      })
    }
  }

  // ── Expense Reports ────────────────────────────────────────────────
  for (const er of store.expenseReports) {
    const score = bestScore([er.title, er.status, empName(er.employee_id)], q)
    if (score > 0) {
      results.push({
        id: er.id,
        type: 'expense',
        title: er.title,
        subtitle: `${er.status} · ${er.currency || ''} ${Number(er.total_amount || 0).toLocaleString()} · ${empName(er.employee_id)}`,
        link: '/expense',
        icon: 'Receipt',
        score,
      })
    }
  }

  // ── Surveys ────────────────────────────────────────────────────────
  for (const s of store.surveys) {
    const score = bestScore([s.title, s.type], q)
    if (score > 0) {
      results.push({
        id: s.id,
        type: 'survey',
        title: s.title,
        subtitle: `${s.type} Survey · ${s.status}`,
        link: '/engagement',
        icon: 'MessageCircle',
        score,
      })
    }
  }

  // ── Strategic Objectives ───────────────────────────────────────────
  for (const o of store.strategicObjectives) {
    const score = bestScore([o.title, o.description], q)
    if (score > 0) {
      results.push({
        id: o.id,
        type: 'objective',
        title: o.title,
        subtitle: `Strategic Objective · ${o.status} · ${o.period || ''}`,
        link: '/strategy',
        icon: 'Compass',
        score,
      })
    }
  }

  // ── Workflows ──────────────────────────────────────────────────────
  for (const w of store.workflows) {
    const score = bestScore([w.title, w.description], q)
    if (score > 0) {
      results.push({
        id: w.id,
        type: 'workflow',
        title: w.title,
        subtitle: `Workflow · ${w.status}`,
        link: '/workflow-studio',
        icon: 'Zap',
        score,
      })
    }
  }

  // ── Mentoring Programs ─────────────────────────────────────────────
  for (const mp of store.mentoringPrograms) {
    const score = bestScore([mp.title, mp.type], q)
    if (score > 0) {
      results.push({
        id: mp.id,
        type: 'mentoring',
        title: mp.title,
        subtitle: `${mp.type} Mentoring · ${mp.status}`,
        link: '/mentoring',
        icon: 'UserCheck',
        score,
      })
    }
  }

  // ── Invoices ───────────────────────────────────────────────────────
  for (const inv of store.invoices) {
    const score = bestScore([inv.invoice_number, inv.description, inv.status], q)
    if (score > 0) {
      results.push({
        id: inv.id,
        type: 'invoice',
        title: `Invoice ${inv.invoice_number || inv.id.slice(0, 8)}`,
        subtitle: `${inv.status} · ${inv.currency || ''} ${Number(inv.amount || 0).toLocaleString()}`,
        link: '/finance/invoices',
        icon: 'FileText',
        score,
      })
    }
  }

  // ── Budgets ────────────────────────────────────────────────────────
  for (const b of store.budgets) {
    const score = bestScore([b.name, b.fiscal_year, b.status], q)
    if (score > 0) {
      results.push({
        id: b.id,
        type: 'budget',
        title: b.name,
        subtitle: `FY${b.fiscal_year} · ${b.status} · ${b.currency || ''} ${Number(b.total_amount || 0).toLocaleString()}`,
        link: '/finance/budgets',
        icon: 'PieChart',
        score,
      })
    }
  }

  // ── Vendors ────────────────────────────────────────────────────────
  for (const v of store.vendors) {
    const score = bestScore([v.name, v.category, v.contact_email], q)
    if (score > 0) {
      results.push({
        id: v.id,
        type: 'vendor',
        title: v.name,
        subtitle: `${v.category || 'Vendor'} · ${v.status}`,
        link: '/finance/invoices',
        icon: 'Building',
        score,
      })
    }
  }

  // ── IT Requests ────────────────────────────────────────────────────
  for (const ir of store.itRequests) {
    const score = bestScore([ir.title, ir.description, ir.type], q)
    if (score > 0) {
      results.push({
        id: ir.id,
        type: 'it_request',
        title: ir.title,
        subtitle: `${ir.type} · ${ir.priority} · ${ir.status}`,
        link: '/it/apps',
        icon: 'Monitor',
        score,
      })
    }
  }

  // Sort by score descending, then alphabetically
  results.sort((a, b) => (b.score || 0) - (a.score || 0) || a.title.localeCompare(b.title))

  return results.slice(0, limit)
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSearch(): UseSearchReturn {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const store = useTempoSafe()

  // Debounce the query
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (query.length < 2) {
      setDebouncedQuery('')
      return
    }

    setIsLoading(true)
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query)
      setIsLoading(false)
    }, 120) // Fast — client-side search is instant

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  const results = useMemo(() => {
    if (!store || debouncedQuery.length < 2) return []
    return searchStore(store, debouncedQuery)
  }, [store, debouncedQuery])

  return {
    query,
    setQuery,
    results,
    isLoading,
    error: null,
    total: results.length,
  }
}
