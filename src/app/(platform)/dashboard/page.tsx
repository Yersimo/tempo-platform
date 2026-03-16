'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Badge } from '@/components/ui/badge'
import { Tabs } from '@/components/ui/tabs'
import {
  Settings, LayoutGrid, RotateCcw, Eye, EyeOff, GripVertical
} from 'lucide-react'
import { useTempo } from '@/lib/store'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { isEvaluatorAccount, getEvaluatorConfig } from '@/lib/evaluator-demo-data'
import { HEADER_ICON, BUTTON_ICON } from '@/lib/design-tokens'
import { getAllAppModules } from '@/components/layout/sidebar'
import { EmployeeDashboard } from '@/components/employee-dashboard'
import { OrgTab } from '@/components/dashboard/org-tab'
import { MyOverviewTab } from '@/components/dashboard/my-overview-tab'
import { MyTeamTab } from '@/components/dashboard/my-team-tab'
import { useSortable } from '@/lib/use-drag-drop'
import { AIInsightsCard } from '@/components/ui/ai-insights-card'
import { generateExecutiveSummary, identifyNextBestActions } from '@/lib/ai-engine'

export default function DashboardPage() {
  const {
    currentUser,
    widgetPreferences, updateWidgetPreferences,
    employees, departments, goals, leaveRequests,
    reviews, salaryReviews, surveys, engagementScores,
    expenseReports, jobPostings, applications, payrollRuns, mentoringPairs,
  } = useTempo()

  const executiveSummary = useMemo(() => generateExecutiveSummary({
    employees: employees || [],
    goals: goals || [],
    reviews: reviews || [],
    reviewCycles: [],
    salaryReviews: salaryReviews || [],
    surveys: surveys || [],
    engagementScores: engagementScores || [],
    expenseReports: expenseReports || [],
    leaveRequests: leaveRequests || [],
    jobPostings: jobPostings || [],
    applications: applications || [],
    payrollRuns: payrollRuns || [],
    mentoringPairs: mentoringPairs || [],
  }), [employees, goals, reviews, salaryReviews, surveys, engagementScores, expenseReports, leaveRequests, jobPostings, applications, payrollRuns, mentoringPairs])

  const nextActions = useMemo(() => identifyNextBestActions({
    reviews: reviews || [],
    leaveRequests: leaveRequests || [],
    expenseReports: expenseReports || [],
    salaryReviews: salaryReviews || [],
    goals: goals || [],
    jobPostings: jobPostings || [],
    applications: applications || [],
  }), [reviews, leaveRequests, expenseReports, salaryReviews, goals, jobPostings, applications])

  const summaryInsights = useMemo(() => [{
    id: 'exec-summary',
    category: 'narrative' as const,
    severity: 'info' as const,
    title: 'Executive Summary',
    description: executiveSummary.summary,
    confidence: 'high' as const,
    confidenceScore: 85,
    module: 'dashboard',
  }], [executiveSummary])

  const router = useRouter()
  const t = useTranslations('dashboard')
  const tc = useTranslations('common')

  const [showWidgetModal, setShowWidgetModal] = useState(false)
  const [dashboardTab, setDashboardTab] = useState('me')

  // Employee self-service: simplified dashboard for employee role
  const role = currentUser?.role || 'owner'
  if (role === 'employee') {
    return <EmployeeDashboard />
  }

  const firstName = currentUser?.full_name?.split(' ')[0] || 'Amara'

  // Evaluator account detection
  const userEmail = currentUser?.email || ''
  const isEvaluator = isEvaluatorAccount(userEmail)
  const evaluatorConfig = isEvaluator ? getEvaluatorConfig(userEmail) : null

  // Time-of-day greeting (Oracle Fusion-inspired)
  const timeGreeting = (() => {
    const h = new Date().getHours()
    if (h >= 5 && h < 12) return 'greetingMorning'
    if (h >= 12 && h < 17) return 'greetingAfternoon'
    if (h >= 17 && h < 21) return 'greetingEvening'
    return 'greetingNight'
  })()

  // Tab-specific subtitle
  const subtitleKey = dashboardTab === 'me' ? 'subtitleMe' : dashboardTab === 'team' ? 'subtitleTeam' : 'subtitleOrg'

  const dashboardTabs = [
    { id: 'me', label: t('tabMe') },
    { id: 'team', label: t('tabMyTeam') },
    { id: 'org', label: t('tabOrganization') },
  ]

  return (
    <>
      <Header
        title={t('title')}
        subtitle={`${t(timeGreeting, { name: firstName })} ${t(subtitleKey)}`}
        hideBreadcrumb
        actions={
          <div className="flex items-center gap-2">
            {dashboardTab === 'org' && (
              <Button variant="secondary" size="sm" onClick={() => setShowWidgetModal(true)}><LayoutGrid size={HEADER_ICON} /> {t('customizeWidgets')}</Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => router.push('/settings')}><Settings size={HEADER_ICON} /></Button>
          </div>
        }
      />

      {/* Evaluator Dashboard Banner */}
      {isEvaluator && evaluatorConfig && (
        <div className="rounded-2xl border border-border/80 bg-white p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-t1">Welcome, {evaluatorConfig.firstName}</h2>
              <p className="text-sm text-t3 mt-1">Ghana Payroll Evaluation Environment — Ecobank Transnational</p>
            </div>
            <Link href="/payroll">
              <Button variant="primary" size="md">Start Payroll Demo &rarr;</Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-gray-50">
              <p className="text-[10px] uppercase tracking-wider text-t3 font-medium">Payroll Cost (This Month)</p>
              <p className="text-2xl font-semibold text-t1 mt-1">GH₵ 847,500</p>
              <p className="text-xs text-t3">Ghana • Nigeria • Kenya</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50">
              <p className="text-[10px] uppercase tracking-wider text-t3 font-medium">Compa Ratio</p>
              <p className="text-2xl font-semibold text-t1 mt-1">0.96</p>
              <p className="text-xs text-t3">Within 4% of market P50</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50">
              <p className="text-[10px] uppercase tracking-wider text-t3 font-medium">Benefits Enrollment</p>
              <p className="text-2xl font-semibold text-t1 mt-1">87%</p>
              <p className="text-xs text-emerald-600">+3% vs Q4</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50">
              <p className="text-[10px] uppercase tracking-wider text-t3 font-medium">Pending Approvals</p>
              <p className="text-2xl font-semibold text-tempo-600 mt-1">1</p>
              <p className="text-xs text-t3">April payroll ready</p>
            </div>
          </div>
        </div>
      )}

      {/* Oracle Fusion-style Me / My Team / Organization tabs */}
      <Tabs
        tabs={dashboardTabs}
        active={dashboardTab}
        onChange={setDashboardTab}
        className="mb-6"
      />

      <AIInsightsCard
        insights={summaryInsights}
        recommendations={nextActions}
        title="Tempo AI — Executive Summary"
        maxVisible={4}
        className="mb-6"
      />

      {/* Tab Content */}
      {dashboardTab === 'me' && <MyOverviewTab />}
      {dashboardTab === 'team' && <MyTeamTab />}
      {dashboardTab === 'org' && <OrgTab />}

      {/* Your Apps Grid (Rippling-style) */}
      <YourAppsGrid />

      {/* Widget Customization Modal */}
      {showWidgetModal && (
        <WidgetCustomizationModal
          open={showWidgetModal}
          onClose={() => setShowWidgetModal(false)}
          widgetPreferences={widgetPreferences}
          updateWidgetPreferences={updateWidgetPreferences}
          t={t}
          tc={tc}
        />
      )}
    </>
  )
}

// Extracted widget modal with drag-drop reordering
function WidgetCustomizationModal({
  open, onClose, widgetPreferences, updateWidgetPreferences, t, tc
}: {
  open: boolean
  onClose: () => void
  widgetPreferences: ReturnType<typeof useTempo>['widgetPreferences']
  updateWidgetPreferences: ReturnType<typeof useTempo>['updateWidgetPreferences']
  t: ReturnType<typeof useTranslations>
  tc: ReturnType<typeof useTranslations>
}) {
  const sortedWidgets = [...widgetPreferences.widgets].sort((a, b) => a.position - b.position)

  const { getItemHandlers, dragIndex, overIndex } = useSortable({
    items: sortedWidgets,
    type: 'widget',
    onReorder: (fromIndex, toIndex) => {
      const reordered = [...sortedWidgets]
      const [moved] = reordered.splice(fromIndex, 1)
      reordered.splice(toIndex, 0, moved)
      const updated = reordered.map((w, i) => ({ ...w, position: i }))
      updateWidgetPreferences({ widgets: updated })
    },
  })

  return (
    <Modal open={open} onClose={onClose} title={t('widgetCustomization')} size="lg">
      <p className="text-xs text-t3 mb-4">{t('widgetToggle')}</p>
      <div className="flex items-center justify-between mb-4">
        <Badge variant="info">{t('widgetsEnabled', { count: widgetPreferences.widgets.filter(w => w.enabled).length })}</Badge>
        <Button variant="ghost" size="sm" onClick={() => {
          const reset = widgetPreferences.widgets.map((w, i) => ({ ...w, enabled: i < 11, position: i }))
          updateWidgetPreferences({ widgets: reset })
        }}><RotateCcw size={BUTTON_ICON} /> {t('resetLayout')}</Button>
      </div>

      <div className="space-y-1.5">
        {sortedWidgets.map((widget, index) => {
          const handlers = getItemHandlers(index)
          return (
            <div
              key={widget.id}
              {...handlers}
              className={cn(
                'flex items-center gap-2 p-3 rounded-lg border transition-all',
                widget.enabled ? 'bg-tempo-50/50 border-tempo-200' : 'bg-surface-secondary border-divider',
                dragIndex === index && 'opacity-40',
                overIndex === index && dragIndex !== index && 'border-tempo-500 ring-1 ring-tempo-500/30'
              )}
            >
              <div className="cursor-grab active:cursor-grabbing text-t3 hover:text-t2 flex-shrink-0">
                <GripVertical size={BUTTON_ICON} />
              </div>
              <div
                className="flex items-center justify-between flex-1 cursor-pointer"
                onClick={() => {
                  const updated = widgetPreferences.widgets.map(w =>
                    w.id === widget.id ? { ...w, enabled: !w.enabled } : w
                  )
                  updateWidgetPreferences({ widgets: updated })
                }}
              >
                <div className="flex items-center gap-2">
                  {widget.enabled ? <Eye size={BUTTON_ICON} className="text-tempo-600" /> : <EyeOff size={BUTTON_ICON} className="text-t3" />}
                  <span className={cn('text-xs', widget.enabled ? 'font-medium text-t1' : 'text-t3')}>{widget.name}</span>
                  <span className="text-[0.6rem] text-t3 bg-canvas px-1.5 py-0.5 rounded">{widget.category}</span>
                </div>
                <div className={cn(
                  'w-8 h-5 rounded-full flex items-center transition-all flex-shrink-0',
                  widget.enabled ? 'bg-tempo-500 justify-end' : 'bg-gray-300 justify-start'
                )}>
                  <div className="w-4 h-4 rounded-full bg-white shadow mx-0.5" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-divider mt-4">
        <Button variant="secondary" onClick={onClose}>{tc('cancel')}</Button>
        <Button onClick={onClose}>{t('saveLayout')}</Button>
      </div>
    </Modal>
  )
}

// Rippling-style "Your Apps" grid
function YourAppsGrid() {
  const allApps = getAllAppModules()
  return (
    <div className="mt-6 mb-6">
      <h2 className="text-lg font-semibold text-t1 mb-3">Your Apps</h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3">
        {allApps.map(app => (
          <Link
            key={app.href}
            href={app.href}
            className="group flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-surface-secondary transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-chrome flex items-center justify-center text-tempo-400 group-hover:scale-105 transition-transform">
              {app.icon}
            </div>
            <span className="text-[0.7rem] text-t2 text-center leading-tight font-medium truncate w-full">
              {app.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

// Helper for cn utility in this file
function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}
