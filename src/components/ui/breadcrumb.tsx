'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  people: 'People',
  performance: 'Performance',
  compensation: 'Compensation',
  learning: 'Learning',
  engagement: 'Engagement',
  mentoring: 'Mentoring',
  payroll: 'Payroll',
  'time-attendance': 'Time & Attendance',
  benefits: 'Benefits',
  expense: 'Expense',
  recruiting: 'Recruiting',
  it: 'IT',
  devices: 'Devices',
  apps: 'Apps',
  finance: 'Finance',
  invoices: 'Invoices',
  budgets: 'Budgets',
  projects: 'Projects',
  strategy: 'Strategy',
  'workflow-studio': 'Workflow Studio',
  analytics: 'Analytics',
  settings: 'Settings',
}

export function Breadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length <= 1) return null

  const crumbs = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/')
    const label = routeLabels[segment] || segment.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    const isLast = index === segments.length - 1
    return { href, label, isLast }
  })

  return (
    <nav className="flex items-center gap-1.5 text-[0.7rem] text-t3 mb-2">
      <Link href="/dashboard" className="hover:text-t1 transition-colors">
        <Home size={12} />
      </Link>
      {crumbs.map((crumb) => (
        <span key={crumb.href} className="flex items-center gap-1.5">
          <ChevronRight size={10} className="text-t3/50" />
          {crumb.isLast ? (
            <span className="text-t2 font-medium">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-t1 transition-colors">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}
