import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { ilike, or } from 'drizzle-orm'

// GET /api/search?q=query&type=all|employees|goals|projects|...
export async function GET(request: NextRequest) {
  const employeeId = request.headers.get('x-employee-id')
  const orgId = request.headers.get('x-org-id')

  if (!employeeId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const query = url.searchParams.get('q')?.trim()
  const type = url.searchParams.get('type') || 'all'
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50)

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [], total: 0 })
  }

  const searchPattern = `%${query}%`
  const results: SearchResult[] = []

  // Search across multiple entity types in parallel
  const searches: Promise<void>[] = []

  if (type === 'all' || type === 'employees') {
    searches.push(searchEmployees(orgId, searchPattern, limit, results))
  }
  if (type === 'all' || type === 'goals') {
    searches.push(searchGoals(orgId, searchPattern, limit, results))
  }
  if (type === 'all' || type === 'projects') {
    searches.push(searchProjects(orgId, searchPattern, limit, results))
  }
  if (type === 'all' || type === 'courses') {
    searches.push(searchCourses(orgId, searchPattern, limit, results))
  }
  if (type === 'all' || type === 'jobs') {
    searches.push(searchJobs(orgId, searchPattern, limit, results))
  }
  if (type === 'all' || type === 'objectives') {
    searches.push(searchObjectives(orgId, searchPattern, limit, results))
  }
  if (type === 'all' || type === 'workflows') {
    searches.push(searchWorkflows(orgId, searchPattern, limit, results))
  }
  if (type === 'all' || type === 'policies') {
    searches.push(searchPolicies(orgId, searchPattern, limit, results))
  }
  if (type === 'all' || type === 'leave') {
    searches.push(searchLeave(orgId, searchPattern, limit, results))
  }
  if (type === 'all' || type === 'expenses') {
    searches.push(searchExpenses(orgId, searchPattern, limit, results))
  }

  await Promise.all(searches)

  // Sort by relevance (exact matches first, then partial)
  const lowerQuery = query.toLowerCase()
  results.sort((a, b) => {
    const aExact = a.title.toLowerCase().includes(lowerQuery) ? 1 : 0
    const bExact = b.title.toLowerCase().includes(lowerQuery) ? 1 : 0
    return bExact - aExact
  })

  return NextResponse.json({
    results: results.slice(0, limit),
    total: results.length,
    query,
  })
}

interface SearchResult {
  id: string
  type: 'employee' | 'goal' | 'project' | 'course' | 'job' | 'objective' | 'workflow' | 'policy' | 'leave' | 'expense'
  title: string
  subtitle: string
  link: string
  icon: string // lucide icon name
}

async function searchEmployees(orgId: string, pattern: string, limit: number, results: SearchResult[]) {
  try {
    const rows = await db.select()
      .from(schema.employees)
      .where(
        or(
          ilike(schema.employees.fullName, pattern),
          ilike(schema.employees.email, pattern),
          ilike(schema.employees.jobTitle, pattern)
        )
      )
      .limit(limit)

    for (const row of rows) {
      if (row.orgId !== orgId) continue
      results.push({
        id: row.id,
        type: 'employee',
        title: row.fullName,
        subtitle: `${row.jobTitle || 'Employee'} - ${row.email}`,
        link: `/people/${row.id}`,
        icon: 'User',
      })
    }
  } catch { /* table may not exist in demo mode */ }
}

async function searchGoals(orgId: string, pattern: string, limit: number, results: SearchResult[]) {
  try {
    const rows = await db.select()
      .from(schema.goals)
      .where(
        or(
          ilike(schema.goals.title, pattern),
          ilike(schema.goals.description, pattern)
        )
      )
      .limit(limit)

    for (const row of rows) {
      if (row.orgId !== orgId) continue
      results.push({
        id: row.id,
        type: 'goal',
        title: row.title,
        subtitle: `Goal - ${row.status} - ${row.category}`,
        link: '/performance',
        icon: 'Target',
      })
    }
  } catch { /* table may not exist in demo mode */ }
}

async function searchProjects(orgId: string, pattern: string, limit: number, results: SearchResult[]) {
  try {
    const rows = await db.select()
      .from(schema.projects)
      .where(
        or(
          ilike(schema.projects.title, pattern),
          ilike(schema.projects.description, pattern)
        )
      )
      .limit(limit)

    for (const row of rows) {
      if (row.orgId !== orgId) continue
      results.push({
        id: row.id,
        type: 'project',
        title: row.title,
        subtitle: `Project - ${row.status}`,
        link: '/projects',
        icon: 'FolderKanban',
      })
    }
  } catch { /* table may not exist in demo mode */ }
}

async function searchCourses(orgId: string, pattern: string, limit: number, results: SearchResult[]) {
  try {
    const rows = await db.select()
      .from(schema.courses)
      .where(
        or(
          ilike(schema.courses.title, pattern),
          ilike(schema.courses.description, pattern)
        )
      )
      .limit(limit)

    for (const row of rows) {
      if (row.orgId !== orgId) continue
      results.push({
        id: row.id,
        type: 'course',
        title: row.title,
        subtitle: `Course - ${row.format} - ${row.level}`,
        link: '/learning',
        icon: 'BookOpen',
      })
    }
  } catch { /* table may not exist in demo mode */ }
}

async function searchJobs(orgId: string, pattern: string, limit: number, results: SearchResult[]) {
  try {
    const rows = await db.select()
      .from(schema.jobPostings)
      .where(
        or(
          ilike(schema.jobPostings.title, pattern),
          ilike(schema.jobPostings.description, pattern)
        )
      )
      .limit(limit)

    for (const row of rows) {
      if (row.orgId !== orgId) continue
      results.push({
        id: row.id,
        type: 'job',
        title: row.title,
        subtitle: `Job Posting - ${row.status} - ${row.location || ''}`,
        link: '/recruiting',
        icon: 'Briefcase',
      })
    }
  } catch { /* table may not exist in demo mode */ }
}

async function searchObjectives(orgId: string, pattern: string, limit: number, results: SearchResult[]) {
  try {
    const rows = await db.select()
      .from(schema.strategicObjectives)
      .where(
        or(
          ilike(schema.strategicObjectives.title, pattern),
          ilike(schema.strategicObjectives.description, pattern)
        )
      )
      .limit(limit)

    for (const row of rows) {
      if (row.orgId !== orgId) continue
      results.push({
        id: row.id,
        type: 'objective',
        title: row.title,
        subtitle: `Strategic Objective - ${row.status}`,
        link: '/strategy',
        icon: 'Compass',
      })
    }
  } catch { /* table may not exist in demo mode */ }
}

async function searchWorkflows(orgId: string, pattern: string, limit: number, results: SearchResult[]) {
  try {
    const rows = await db.select()
      .from(schema.workflows)
      .where(
        or(
          ilike(schema.workflows.title, pattern),
          ilike(schema.workflows.description, pattern)
        )
      )
      .limit(limit)

    for (const row of rows) {
      if (row.orgId !== orgId) continue
      results.push({
        id: row.id,
        type: 'workflow',
        title: row.title,
        subtitle: `Workflow - ${row.status}`,
        link: '/workflow-studio',
        icon: 'Zap',
      })
    }
  } catch { /* table may not exist in demo mode */ }
}

async function searchPolicies(orgId: string, pattern: string, limit: number, results: SearchResult[]) {
  try {
    const rows = await db.select()
      .from(schema.benefitPlans)
      .where(
        or(
          ilike(schema.benefitPlans.name, pattern),
          ilike(schema.benefitPlans.description, pattern)
        )
      )
      .limit(limit)

    for (const row of rows) {
      if (row.orgId !== orgId) continue
      results.push({
        id: row.id,
        type: 'policy',
        title: row.name,
        subtitle: `Benefit Plan - ${row.type}${row.provider ? ` - ${row.provider}` : ''}`,
        link: '/benefits',
        icon: 'Shield',
      })
    }
  } catch { /* table may not exist in demo mode */ }
}

async function searchLeave(orgId: string, pattern: string, limit: number, results: SearchResult[]) {
  try {
    const rows = await db.select()
      .from(schema.leaveRequests)
      .where(
        or(
          ilike(schema.leaveRequests.type, pattern),
          ilike(schema.leaveRequests.reason, pattern)
        )
      )
      .limit(limit)

    for (const row of rows) {
      if (row.orgId !== orgId) continue
      results.push({
        id: row.id,
        type: 'leave',
        title: `${row.type} Leave - ${row.days} days`,
        subtitle: `${row.status} - ${row.startDate} to ${row.endDate}`,
        link: '/time-attendance',
        icon: 'CalendarCheck',
      })
    }
  } catch { /* table may not exist in demo mode */ }
}

async function searchExpenses(orgId: string, pattern: string, limit: number, results: SearchResult[]) {
  try {
    const rows = await db.select()
      .from(schema.expenseReports)
      .where(
        ilike(schema.expenseReports.title, pattern)
      )
      .limit(limit)

    for (const row of rows) {
      if (row.orgId !== orgId) continue
      results.push({
        id: row.id,
        type: 'expense',
        title: row.title,
        subtitle: `Expense Report - ${row.status} - $${row.totalAmount.toLocaleString()}`,
        link: '/expense',
        icon: 'Receipt',
      })
    }
  } catch { /* table may not exist in demo mode */ }
}
